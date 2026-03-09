import mongoose, { Document, Schema as MongooseSchema } from "mongoose";

// 2. سكيما الغرف الخاصة (Room Schema) - المجموعات
export interface IRoom extends Document {
    name: string;          // اسم المجموعة
    admin: mongoose.Types.ObjectId; // من أنشأ المجموعة
    members: mongoose.Types.ObjectId[]; // الأعضاء (أصدقاؤه)
    isGroup: boolean;
    groupImage?: string;
}

const roomSchema = new mongoose.Schema<IRoom>({
    name: { type: String, required: true },
    admin: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    isGroup: { type: Boolean, default: true },
    groupImage: { type: String, default: 'group-default.png' }
}, {
    timestamps: true
});
roomSchema.virtual('groupImage').get(function (this: IRoom) {
  if (this.groupImage) {
    if (this.groupImage.startsWith('http://m2dd-serverchatapp.hf.space')) {
      return this.groupImage.replace('http://', 'https://');
    }
    if (!this.groupImage.startsWith('http')) {
      return `https://m2dd-serverchatapp.hf.space{this.groupImage}`;
    }
    
    return this.groupImage; 
  }
  return null;
});
export const Room = mongoose.model<IRoom>('Room', roomSchema);
