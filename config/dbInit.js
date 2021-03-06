/**
 * Created by ar on 7/16/15.
 */
/**
 * Created by ar on 7/16/15.
 */
var orm = require("orm");
var modts = require('orm-timestamps');
var params=require("../config/params");
var dbmodel=require("../model/dbmodel");
var gModel;
var gdb;

var getDBForDirect=function (callback ) {
    if (gdb) {

        callback(null, gdb);
    } else {
        getDB(function (err, sdb, model2) {

            if (err) {
                callback(err, null);
            } else {
                gdb = sdb;
                callback(null, gdb);
            }
        });
    }

};
var define=false;
var dbDefine=function(db, callback ){

    if (define){
        callback(null,db);
        return;
    }
    define=true;
    try {
        db.use(modts, dbmodel.mUse);

        gModel = dbmodel.model;
        for (var table in dbmodel.model) {
            if (dbmodel.model.hasOwnProperty(table)) {
                if (dbmodel.model[table].features) {
                    var record = db.define(dbmodel.model[table].name,
                        dbmodel.model[table].fields,
                        dbmodel.model[table].features
                    );
                }else{

                    var record = db.define(dbmodel.model[table].name,
                        dbmodel.model[table].fields
                    );
                }
                gModel[table] = record;
            }
        }
        callback(null,db);
    }catch(e){
        callback(e,null,null);
    }
};
var getDB=function (callback ) {

    if (gModel!=null){

        callback(null, gdb, gModel);
    }else {
        orm.connect(params.database.connectionURL, function (err, db) {
            if (err) {
                callback(err, null, null);
            }
            dbDefine(db, function (err, dbr) {

                if (err) {
                    callback(err, null, null);
                } else {

                    //gModel = model;
                    gdb = dbr;

                    callback(null, gdb, gModel);
                }
            });

        });
    }
};

module.exports.dbDefine=dbDefine;
module.exports.getDB=getDB;
module.exports.getDBForDirect=getDBForDirect;