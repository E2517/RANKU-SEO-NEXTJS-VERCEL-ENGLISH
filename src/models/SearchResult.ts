
import { Schema, model, models, Model, Types } from 'mongoose';

export interface ISearchResult {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    buscador?: string;
    dispositivo?: string;
    posicion?: number;
    posicionAnterior?: number | null;
    fechaPosicionAnterior?: Date | null;
    palabraClave?: string;
    dominio?: string;
    tipoBusqueda: 'palabraClave' | 'dominio';
    dominioFiltrado?: string;
    location?: string;
    rating?: number;
    reviews?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ISearchResultMethods { }

type SearchResultModel = Model<ISearchResult, {}, ISearchResultMethods>;

const searchResultSchema = new Schema<ISearchResult, SearchResultModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        buscador: String,
        dispositivo: String,
        posicion: Number,
        posicionAnterior: { type: Number, default: null },
        fechaPosicionAnterior: { type: Date, default: null },
        palabraClave: String,
        dominio: String,
        tipoBusqueda: {
            type: String,
            enum: ['palabraClave', 'dominio'],
            required: true,
        },
        dominioFiltrado: String,
        location: String,
        rating: Number,
        reviews: Number,
    },
    { timestamps: true }
);

searchResultSchema.index({
    userId: 1,
    tipoBusqueda: 1,
    palabraClave: 1,
    location: 1,
    dispositivo: 1,
    buscador: 1,
    createdAt: -1,
});

const SearchResult = (models.SearchResult as SearchResultModel) || model<ISearchResult, SearchResultModel>('SearchResult', searchResultSchema);

export default SearchResult;