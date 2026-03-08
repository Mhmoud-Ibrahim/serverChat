 import mongoose from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    userImage: string;
    fulluserImage?: string // حقل اختياري للرابط الكامل
}

const Schema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    userImage: { type: String, default: null } // 👈 التأكد أن هذا موجود
}, {
    timestamps: true,
    toJSON: { virtuals: true }, // 👈 ضروري جداً لظهور الرابط في الفرونت
    toObject: { virtuals: true }
});

// Schema.virtual('fulluserImage').get(function (this: IUser) {
//     if (this.userImage) {
//         // تأكد أن المسار يطابق مجلد Multer (uploads/messages)
//         return `https://m2dd-chatserver.hf.space/uploads/profiles/${this.userImage}`;
//     }
//     return null;
// });
// Schema.virtual('fulluserImage').get(function (this: IUser) {
//   if (this.userImage && !this.userImage.startsWith('https')) {
//     return `https://m2dd-chatserver.hf.space/uploads/messages/${this.userImage}`;
//   }
//   return this.userImage;
// });
Schema.virtual('fulluserImage').get(function (this: IUser) {
  if (this.userImage) {
    if (this.userImage.startsWith('http://m2dd-serverchatapp.hf.space')) {
      return this.userImage.replace('http://', 'https://');
    }
    if (!this.userImage.startsWith('http')) {
      return `https://m2dd-serverchatapp.hf.space/uploads/profiles/${this.userImage}`;
    }
    
    return this.userImage;
  }
  return null;
});

export const User = mongoose.model('User', Schema)