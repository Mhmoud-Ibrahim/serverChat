
import { Server, Socket } from "socket.io";
import { MessagesModel } from "../../../db/models/messages.model.js";
import { User } from "../../../db/models/user.model.js";
import { Room } from "../../../db/models/room.model.js";

interface PrivateMessagePayload {
  msg?: string;
  imageUrl?: string
  receiverId: string;
}

const onlineUsers = new Map<string, { socketId: string; name: string; userImage?: string }>();

export const registerChatHandlers = async (io: Server, socket: Socket) => {
  const userId: string = socket.data.userId;

  if (userId) {
    try {
      const user = await User.findById(userId).select("name");
      if (user) {
        onlineUsers.set(userId, {
          socketId: socket.id,
          name: user.name,
          userImage: user.userImage
        });
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  }

  // --- 1. حدث الانضمام لغرفة مجموعة ---
  socket.on("join_group", async ({ roomId }) => {
    try {
      const room = await Room.findOne({ _id: roomId, members: userId });
      if (!room) return console.error("Unauthorized room access");

      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);

      const history = await MessagesModel.find({ room: roomId }).sort({ createdAt: 1 });
      socket.emit('get_history', history);
    } catch (error) {
      console.error("Error joining group:", error);
    }
  });

  // --- 2. إرسال رسالة داخل مجموعة ---
 socket.on("send_group_msg", async ({ roomId, msg, imageUrl }) => {
    try {
      const savedMsg = await MessagesModel.create({
        text: msg || "",
        imageUrl: imageUrl || "",
        sender: userId,
        room: roomId, // الحفظ في الداتابيز كما هو
        seen: false
      });

         const responseData = {
        _id: savedMsg._id,
        text: savedMsg.text,
        imageUrl: savedMsg.imageUrl,
        senderId: userId,
        senderName: socket.data.userName, 
        roomId: roomId, 
        createdAt: savedMsg.createdAt
      };
     io.to(roomId).emit("receive_group_msg", responseData);

    } catch (error) {
      console.error("Error sending group message:", error);
    }
  });

  // --- 3. مغادرة الغرفة ---
  socket.on("leave_group", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room: ${roomId}`);
  });

  const broadcastOnlineUsers = () => {
    const usersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
      userId: id,
      name: data.name,
      userImage: data.userImage
    }));
    io.emit("online_users", usersList);
  };

  socket.on("messages_read", async ({ senderId }: { senderId: string }) => {
    const receiverId = socket.data.userId;
    try {
      await MessagesModel.updateMany(
        { sender: senderId, receiver: receiverId, seen: false },
        { $set: { seen: true } }
      );

      const senderData = onlineUsers.get(senderId);
      if (senderData) {
        io.to(senderData.socketId).emit("messages_read_update", {
          readBy: receiverId
        });
      }
    } catch (error) {
      console.error("Error in messages_read:", error);
    }
  });

  broadcastOnlineUsers();

  socket.on("get_chat_history", async ({ receiverId }) => {
    const senderId = socket.data.userId;
    try {
      const history = await MessagesModel.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ]
      }).sort({ createdAt: 1 });
      socket.emit('get_history', history);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  });

  const handlePrivateMessage = async ({ msg, receiverId, imageUrl }: PrivateMessagePayload) => {
    const senderId = socket.data.userId;
    try {
      const savedMsg = await MessagesModel.create({
        text: msg || "",
        imageUrl: imageUrl || '',
        sender: senderId,
        receiver: receiverId,
        seen: false
      });

      const responseData = {
        _id: savedMsg._id,
        text: savedMsg.text,
        imageUrl: savedMsg.imageUrl,
        senderId: senderId,
        receiverId: receiverId,
        seen: savedMsg.seen,
        createdAt: (savedMsg as any).createdAt
      };

      const receiverData = onlineUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit("private_reply", responseData);
      }
      socket.emit("private_reply", responseData);

      const history = await MessagesModel.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ]
      }).sort({ createdAt: 1 });

      socket.emit('get_history', history);
      if (receiverData) {
        io.to(receiverData.socketId).emit('get_history', history);
      }
    } catch (error) {
      console.error("Error in private message:", error);
    }
  };

  const handleDeleteMessage = async ({ messageId, receiverId }: { messageId: string, receiverId: string }) => {
    const senderId = socket.data.userId;
    try {
      const message = await MessagesModel.findOneAndDelete({ _id: messageId, sender: senderId });
      if (message) {
        socket.emit("message_deleted", { messageId });
        const receiverData = onlineUsers.get(receiverId);
        if (receiverData) io.to(receiverData.socketId).emit("message_deleted", { messageId });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteSenderMessages = async ({ receiverId }: { receiverId: string }) => {
    try {
      await MessagesModel.deleteMany({ sender: socket.data.userId, receiver: receiverId });
      const history = await MessagesModel.find({
        $or: [
          { sender: socket.data.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.data.userId }
        ]
      }).sort({ createdAt: 1 });
      socket.emit('get_history', history);
      const receiverData = onlineUsers.get(receiverId);
      if (receiverData) io.to(receiverData.socketId).emit('get_history', history);
    } catch (error) {
      console.error("Error deleting sender messages:", error);
    }
  };

  socket.on("update_profile", async (updatedData) => {
    try {
      const userId = socket.data.userId;
      const updatedUser = await User.findByIdAndUpdate(userId, { $set: updatedData }, { new: true });
      if (!updatedUser) return socket.emit("error", "User not found");
      socket.emit("profile_updated", { user: updatedUser });
    } catch (err) {
      socket.emit("error", "Failed to update profile");
    }
  });

  socket.on("delete_msg", handleDeleteMessage);
  socket.on("delete_sender_messages", (data) => handleDeleteSenderMessages(data));
  socket.on("private_msg", handlePrivateMessage);

  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      broadcastOnlineUsers();
    }
    console.log(`User ${userId} disconnected`);
  });
};
