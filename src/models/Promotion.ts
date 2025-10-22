import { Schema, model, models, Model, Types } from 'mongoose';

export interface IPromotion {
    _id?: Types.ObjectId;
    type: 'trial'; 
    isActive: boolean;
    trialPeriodDays: number;
    updatedAt: Date;
}

interface IPromotionMethods { }

type PromotionModel = Model<IPromotion, {}, IPromotionMethods>;

const promotionSchema = new Schema<IPromotion, PromotionModel>(
    {
        type: {
            type: String,
            enum: ['trial'],
            required: true,
            unique: true, 
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        trialPeriodDays: {
            type: Number,
            default: 7,
            min: 1,
            max: 90,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false } 
);

const Promotion = (models.Promotion as PromotionModel) || model<IPromotion, PromotionModel>('Promotion', promotionSchema);

export default Promotion;