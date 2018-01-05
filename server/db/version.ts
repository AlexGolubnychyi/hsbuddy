import mongoose from '../lib/mongoose';


const versionSchema = new mongoose.Schema({
    num: Number,
    date: Date
});

versionSchema.static('getVersion', function(){
    const model = this as mongoose.Model<VersionDB>;
    return model.findOne().exec().then(version => {
        return (version && version.num) || 0;
    });
});
versionSchema.static('setVersion', function(num: number) {
    const model = this as mongoose.Model<VersionDB>;
   return  model.findOne().exec().then(version => {
        version = version || new model();
        version.date = new Date();
        version.num = num;
        return version.save();
    });
});

export interface VersionDB extends mongoose.Document {
    num: number;
    date: Date;
}

interface VersionStatics {
    getVersion: () => Promise<number>;
    setVersion: (num: number) => Promise<void>;
}


export default mongoose.model<VersionDB>('Version', versionSchema) as mongoose.Model<VersionDB> & VersionStatics;
