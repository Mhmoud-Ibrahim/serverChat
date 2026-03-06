 import mongoose from "mongoose";
export interface ITask extends Document {
    name: string;
    email: string;
    password: string;
    userImage: string;
    fullImageUrl?: string; // حقل اختياري للرابط الكامل
}

const Schema = new mongoose.Schema<ITask>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    userImage: { type: String, default: null } // 👈 التأكد أن هذا موجود
}, {
    timestamps: true,
    toJSON: { virtuals: true }, // 👈 ضروري جداً لظهور الرابط في الفرونت
    toObject: { virtuals: true }
});

Schema.virtual('fulluserImage').get(function (this: ITask) {
    if (this.userImage) {
        // تأكد أن المسار يطابق مجلد Multer (uploads/messages)
        return `https://m2dd-chatserver.hf.space/uploads/profiles/${this.userImage}`;
    }
    return null;
});

export const User = mongoose.model('User', Schema)