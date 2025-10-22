import { Schema, model, models, Model, Types } from 'mongoose';
import { ILocalVisibilityCampaign } from './LocalVisibilityCampaign';

export interface ILocalVisibilityResult {
    _id?: Types.ObjectId;
    campaignId: Types.ObjectId | ILocalVisibilityCampaign; 
    searchLocation: {
        lat: number;
        lng: number;
    };
    radius: number;
    distanceFromCenter?: number; 
    ranking: number; 
    placeName?: string | null; 
    placeAddress?: string | null; 
    placeWebsite?: string | null; 
    rawData?: any; 
    createdAt?: Date;
    updatedAt?: Date;
}

interface ILocalVisibilityResultMethods { }

type LocalVisibilityResultModel = Model<ILocalVisibilityResult, {}, ILocalVisibilityResultMethods>;

const localVisibilityResultSchema = new Schema<ILocalVisibilityResult, LocalVisibilityResultModel>(
    {
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: 'LocalVisibilityCampaign',
            required: true,
        },
        searchLocation: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        radius: { type: Number, required: true },
        distanceFromCenter: Number, 
        ranking: { type: Number, default: -1 },
        placeName: { type: String, default: null },
        placeAddress: { type: String, default: null },
        placeWebsite: { type: String, default: null },
        rawData: Object, 
    },
    { timestamps: true } 
);

const LocalVisibilityResult = (models.LocalVisibilityResult as LocalVisibilityResultModel) || model<ILocalVisibilityResult, LocalVisibilityResultModel>('LocalVisibilityResult', localVisibilityResultSchema);

export default LocalVisibilityResult;