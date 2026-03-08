import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage  extends Document {
  text: string;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  imageUrl: string;
  fullImageUrl?: string;
  seen: boolean;
  room: Types.ObjectId;
   createdAt: Date; 
    updatedAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
  text: {
    type: String,
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  receiver: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  imageUrl: { 
    type: String, 
    default: null 
  },room: { type: Schema.Types.ObjectId, 
  ref: 'Room'
 },
  seen: { 
    type: Boolean, default: false }
},

{
timestamps: true,
  versionKey: false,
  // تفعيل الـ Virtuals لتظهر عند إرسال البيانات كـ JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
messageSchema.index({ room: 1, createdAt: 1 });
// بدلاً من 'post init'، نستخدم Virtual لتركيب الرابط ديناميكياً
messageSchema.virtual('fullImageUrl').get(function (this: IMessage) {
  if (this.imageUrl && !this.imageUrl.startsWith('https')) {
    return `https://m2dd-chatserver.hf.space/uploads/messages/${this.imageUrl}`;
  }
  return this.imageUrl;
});

export const MessagesModel = mongoose.model<IMessage>('Messages', messageSchema);
