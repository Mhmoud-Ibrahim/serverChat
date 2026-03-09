 import mongoose from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    userImage: string;
    fullUserImage?: string // حقل اختياري للرابط الكامل
}

const Schema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    userImage: { type: String, default: null } 
}, {
   timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

Schema.virtual('fullUserImage').get(function (this: IUser) {
  if (this.userImage) {
    if (this.userImage.startsWith('http://m2dd-serverchatapp.hf.space')) {
      return this.userImage.replace('http://', 'https://');
    }
    if (!this.userImage.startsWith('http')) {
      return `https://m2dd-serverchatapp.hf.space{this.userImage}`;
    }
    
    return this.userImage; 
  }
  return null;
});

export const User = mongoose.model('User', Schema)