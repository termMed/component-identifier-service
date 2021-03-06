/**
 * Created by ar on 11/24/15.
 */
var db=require("../config/MysqlInit");

var sctid={};

sctid.findById=function(query,callback){
    db.getDB(function (err,connection)
    {
        if (err) throw err;
        var sql = "SELECT * FROM sctId WHERE sctid = '" + query.sctid + "'";
        connection.query(sql, function(error, rows)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                if (rows && rows.length>0) {
                    callback(null, rows[0]);
                }else {
                    callback(null, null);
                }
            }
        });
    });
};

sctid.findByIds=function(query,callback){
    db.getDB(function (err,connection)
    {
        if (err) throw err;
        var sql = "SELECT * FROM sctId WHERE sctid in (" + connection.escape(query.sctid) + ")" ;
        connection.query(sql,  function(error, rows)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                callback(null, rows);
            }
        });
    });
};
sctid.findBySystemId=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;
        var sql = "SELECT * FROM sctId WHERE systemId = " + connection.escape(query.systemId) + " and namespace=" + query.namespace ;
        connection.query(sql, function(error, rows)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                if (rows && rows.length>0) {
                    callback(null, rows);
                }else{
                    callback(null, null);
                }
            }
        });
    });
};
sctid.findBySystemIds=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;

        var sql = "SELECT systemId FROM sctId WHERE systemId in (" + connection.escape(query.systemId) + ") and namespace=" + query.namespace  ;
        connection.query(sql, function(error, rows)
        {

            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {

                callback(null, rows);
            }
        });
    });
};

sctid.findExistingSctIds=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;

        var sql = "SELECT sctid FROM sctId WHERE sctid in (" + connection.escape(query.sctIds) + ")"  ;
        connection.query(sql, function(error, rows)
        {

            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                var ids = [];
                rows.forEach(function(row) {
                    ids.push(row.sctid);
                });
                callback(null, ids);
            }
        });
    });
};
sctid.findExistingSystemIds=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;

        var sql = "SELECT systemId FROM sctId WHERE systemId in (" + connection.escape(query.systemIds) + ") and namespace=" + query.namespace  ;
        connection.query(sql, function(error, rows)
        {

            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                var ids = [];
                rows.forEach(function(row) {
                    ids.push(row.systemId);
                });
                callback(null, ids);
            }
        });
    });
};
sctid.findByJobId=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;

        var sql = "SELECT * FROM sctId WHERE jobId = " + connection.escape(query.jobId) + " UNION SELECT * FROM sctId_log WHERE jobId =  " + connection.escape(query.jobId);
        connection.query(sql, function(error, rows)
        {

            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                var cleanRows = [];
                var ids = [];
                rows.forEach(function(row) {
                    if (ids.indexOf(row.systemId) == -1) {
                        cleanRows.push(row);
                        ids.push(row.systemId);
                    }
                });
                callback(null, cleanRows);
            }
        });
    });
};

sctid.find=function(query, limit, skip, callback){
    db.getDB(function (err,connection)
    {
        if (err) throw err;
        var swhere="";
        for (var field in query) {
            if (query.hasOwnProperty(field)) {

                swhere += " And " + field + "=" + connection.escape(query[field]) ;
            }
        }
        if (swhere!=""){
            swhere = " WHERE " + swhere.substr(5);
        }
        var sql;
        if (limit && limit>0 && (!skip || skip==0)) {
            //sql = "SELECT * FROM sctId" + swhere + " order by sctid limit " + limit;

            sql = "SELECT * FROM sctId USE INDEX (nam_par_st)" + swhere + " order by sctid limit " + limit;
        }else{
            //sql = "SELECT * FROM sctId" + swhere + " order by sctid";
            sql = "SELECT * FROM sctId USE INDEX (nam_par_st)" + swhere + " order by sctid";
        }
        connection.query(sql, function(error, rows)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                if ((!skip || skip==0)) {
                    callback(null, rows);
                }else {
                    var cont = 1;
                    var newRows = [];
                    for (var i = 0; i < rows.length; i++) {
                        if (i >= skip) {
                            if (limit && limit > 0 && limit < cont) {
                                break;
                            }
                            newRows.push(rows[i]);
                            cont++;
                        }
                    }
                    callback(null, newRows);
                }
            }
        });
    });
};

sctid.save=function(sctIdRecord,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;

        var supdate="";
        for (var field in sctIdRecord) {
            if (sctIdRecord.hasOwnProperty(field)) {
                if (field!="sctid") {
                    supdate += " ," + field + "=" + connection.escape(sctIdRecord[field]) ;
                }
            }
        }
        if (supdate) {
            supdate = supdate.substr(2);
            connection.query("UPDATE sctId SET " + supdate + " ,modified_at=now() WHERE sctid='" + sctIdRecord.sctid + "'", function (error, result) {
                connection.release();
                if (error) {
                    callback (error,null);
                }
                else {

                    callback(null, sctIdRecord);
                }
            });
        }else{
            callback(null, sctIdRecord);
        }
    });
};

sctid.updateJobId=function(existingSystemId, jobId, callback){

    db.getDB(function (err,connection)
    {
        if (err) {
            throw err;
        }else{
            connection.query("UPDATE sctId SET JobId=" + connection.escape(jobId) + " ,modified_at=now() WHERE systemId in (" + connection.escape(existingSystemId) + ")", function (error) {
                connection.release();
                if (error) {
                    callback (error,null);
                }
                else {

                    callback(null, null);
                }
            });
        }
    });
};
sctid.updateRegisterStatusAndJobId=function(existingSctId, jobId, callback){

    db.getDB(function (err,connection)
    {
        if (err) {
            throw err;
        }else{
            var sql="UPDATE sctId SET JobId=" + connection.escape(jobId) + " ,modified_at=now()," +
                " status=(case status when 'Available' then 'Assigned' when 'Reserved' then 'Assigned' else status end)" +
                " WHERE sctid in (" + connection.escape(existingSctId) + ")";
            connection.query(sql , function (error) {
                connection.release();
                if (error) {
                    callback (error,null);
                }
                else {

                    callback(null, null);
                }
            });
        }
    });
};

sctid.create=function(sctIdRecord,callback){

    db.getDB(function (err,connection)
    {

        if (err) throw err;
        sctIdRecord.created_at=new Date();
        connection.query('INSERT INTO sctId SET ?', sctIdRecord, function(error, result)
        {
            connection.release();
            if(error)
            {
                callback (error,null);
            }
            else
            {

                callback(null, sctIdRecord);
            }
        });
    });
};

sctid.count=function(query,callback){

    db.getDB(function (err,connection)
    {
        if (err) throw err;
        var swhere="";
        for (var field in query) {
            if (query.hasOwnProperty(field)) {

                swhere += " And " + field + "=" + connection.escape(query[field]) ;
            }
        }
        if (swhere!=""){
            swhere = " WHERE " + swhere.substr(5);
        }
        var sql;
        sql = "SELECT count(*) as count FROM sctId" + swhere ;
        connection.query(sql, function(error, rows)
        {
            connection.release();
            if(error)
            {
                callback(error, null);
            }
            else
            {
                if (rows && rows.length>0) {
                    callback(null, rows[0].count);
                }else{
                    callback(null, 0);
                }
            }
        });
    });
};

sctid.bulkInsert=function(records,callback){

    db.getDB(function (err,connection)
    {

        if (err) throw err;

        connection.query('INSERT INTO sctId (sctid,sequence,namespace,partitionId,checkDigit,systemId,status,author,software,expirationDate,comment,jobId,created_at) values ?', [records], function(error)
        {
            connection.release();
            if(error)
            {
                callback (error,null);
            }
            else
            {

                callback(null, null);
            }
        });
    });
};

module.exports=sctid;