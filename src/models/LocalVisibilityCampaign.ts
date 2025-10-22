import { Schema, model, models, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface ILocalVisibilityCampaign {
    _id?: Types.ObjectId;
    userId: Types.ObjectId | IUser; 
    keyword: string;
    domain: string;
    centerLocation: {
        name: string;
        lat: number;
        lng: number;
    };
    maxRadiusMeters: number; 
    stepMeters: number; 
    createdAt: Date; 
    status: 'pending' | 'processing' | 'running' | 'completed' | 'failed'; 
    updatedAt?: Date; 
}

interface ILocalVisibilityCampaignMethods { }

type LocalVisibilityCampaignModel = Model<ILocalVisibilityCampaign, {}, ILocalVisibilityCampaignMethods>;

const localVisibilityCampaignSchema = new Schema<ILocalVisibilityCampaign, LocalVisibilityCampaignModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        keyword: {
            type: String,
            required: true,
        },
        domain: {
            type: String,
            required: true,
        },
        centerLocation: {
            name: { type: String, required: true },
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        maxRadiusMeters: {
            type: Number,
            default: 10000,
        },
        stepMeters: {
            type: Number,
            default: 250,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'running', 'completed', 'failed'],
            default: 'pending',
        },
    },
    { timestamps: true } 
);

const LocalVisibilityCampaign = (models.LocalVisibilityCampaign as LocalVisibilityCampaignModel) || model<ILocalVisibilityCampaign, LocalVisibilityCampaignModel>('LocalVisibilityCampaign', localVisibilityCampaignSchema);

export default LocalVisibilityCampaign;