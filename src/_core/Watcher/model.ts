import { Schema, model, Document } from 'mongoose';

// Create watcher schema
const WatcherSchema = new Schema(
  {
    // Type of watcher
    id: String,
    type: String,
    status: String,
    // ...any
    // Strict:false => enable storing any other props usefull to construct the watcher class (refered by "type: String")
  },
  { strict: false }
);

export interface IWatcherModel extends Document {
  id?: string;
  type: string;
  status: string;
}

// Export model
export const WatcherModel = model<IWatcherModel>('Watcher', WatcherSchema);
