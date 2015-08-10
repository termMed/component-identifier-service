/**
 * Created by alo on 7/13/15.
 */
'use strict';

var security = require("./../blogic/Security");
var idDM=require("./../blogic/SCTIdBulkDataManager");
var sIdDM=require("./../blogic/SchemeIdBulkDataManager");
var bulkDM=require("./../blogic/BulkJobDataManager");
var job=require("../model/JobType");
var namespace = require("./../blogic/NamespaceDataManager");

function isAbleUser(namespaceId, user){
    var able = false;
    security.admins.forEach(function(admin){
        if (admin == user)
            able = true;
    });
    if (!able){
        if (namespaceId != "false"){
            namespace.getPermissions(namespaceId, function(err, permissions) {
                if (err)
                    return next(err.message);
                else{
                    permissions.forEach(function(permission){
                        if (permission.username == user)
                            able = true;
                    });
                    return able;
                }
            });
        }else
            return able;
    }else
        return able;
}

module.exports.getSctids = function getSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var sctids = req.swagger.params.sctids.value;
    var sctidsArray = sctids.replace(/ /g,"").split(",");
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        idDM.getSctids(sctidsArray,function(err,records){
            if (err){
                return next(err.message);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(records));
        });
    });
};

module.exports.getSctidBySystemIds = function getSctidBySystemIds (req, res, next) {
    var token = req.swagger.params.token.value;
    var systemIds = req.swagger.params.systemIds.value;
    var namespaceId = req.swagger.params.namespaceId.value;
    var systemIdsArray = systemIds.replace(/ /g,"").split(",");
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        idDM.getSctidBySystemIds(namespaceId,systemIdsArray,function(err,records){
            if (err){
                return next(err.message);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(records));
        });
    });
};

module.exports.generateSctids = function generateSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var generationData = req.swagger.params.generationData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(generationData.namespace, data.user.name)){
            if (generationData.systemIds && generationData.systemIds.length!=0 && generationData.systemIds.length!=generationData.quantity){
                return next("SystemIds quantity is not equal to quantity requirement");
            }
            generationData.author=data.user.name;
            generationData.model=job.MODELS.SctId;
            if ((!generationData.systemIds || generationData.systemIds.length==0)
                && (generationData.generateLegacyIds && generationData.generateLegacyIds.toUpperCase()=="TRUE" &&
                    generationData.partitionId.substr(1,1)=="0")) {
                var arrayUuids=[];
                for (var i=0;i<generationData.quantity;i++){
                    arrayUuids.push(guid());
                }
                generationData.systemIds=arrayUuids;
            }
                var additionalJobs=[];
            bulkDM.saveJob(generationData,job.JOBTYPE.generateSctids,function(err,sctIdBulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                if (generationData.generateLegacyIds && generationData.generateLegacyIds.toUpperCase()=="TRUE" &&
                    generationData.partitionId.substr(1,1)=="0") {
                    generationData.model=job.MODELS.SchemeId;
                    generationData.scheme='SNOMEDID';
                    bulkDM.saveJob(generationData,job.JOBTYPE.generateSchemeIds,function(err,snoIdBulkJobRecord) {
                        if (err) {

                            return next(err.message);
                        }
                        generationData.model = job.MODELS.SchemeId;
                        generationData.scheme = 'CTV3ID';
                        additionalJobs.push(snoIdBulkJobRecord);
                        bulkDM.saveJob(generationData, job.JOBTYPE.generateSchemeIds, function (err, ctv3IdBulkJobRecord) {
                            if (err) {

                                return next(err.message);
                            }
                            additionalJobs.push(ctv3IdBulkJobRecord);
                            sctIdBulkJobRecord.additionalJobs=additionalJobs;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(sctIdBulkJobRecord));
                        });
                    });
                }else {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(bulkJobRecord));
                }
            });
        }else
            return next("No permission for the selected operation");
    });
};


module.exports.registerSctids = function registerSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var registrationData = req.swagger.params.registrationData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(registrationData.namespace, data.user.name)){
            if (!registrationData.records || registrationData.records.length==0){

                return next("Records property cannot be empty.");
            }
            registrationData.author=data.user.name;
            registrationData.model=job.MODELS.SctId;
            bulkDM.saveJob(registrationData,job.JOBTYPE.registerSctids,function(err,bulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(bulkJobRecord));
            });
        }else
            return next("No permission for the selected operation");
    });
};

module.exports.reserveSctids = function reserveSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var reservationData = req.swagger.params.reservationData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(reservationData.namespace, data.user.name)){
            if (!reservationData.quantity || reservationData.quantity<1){

                return next("Quantity property cannot be lower to 1.");
            }
            reservationData.author=data.user.name;
            reservationData.model=job.MODELS.SctId;
            bulkDM.saveJob(reservationData,job.JOBTYPE.reserveSctids,function(err,bulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(bulkJobRecord));
            });
        }else
            return next("No permission for the selected operation");
    });
};

module.exports.deprecateSctids = function deprecateSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var deprecationData = req.swagger.params.deprecationData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(deprecationData.namespace, data.user.name)){
            if (!deprecationData.sctids || deprecationData.sctids.length<1){

                return next("Sctids property cannot be empty.");
            }
            deprecationData.author=data.user.name;
            deprecationData.model=job.MODELS.SctId;
            bulkDM.saveJob(deprecationData,job.JOBTYPE.deprecateSctids,function(err,bulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(bulkJobRecord));
            });
        }else
            return next("No permission for the selected operation");
    });
};

module.exports.releaseSctids = function releaseSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var releaseData = req.swagger.params.releaseData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(releaseData.namespace, data.user.name)){
            if (!releaseData.sctids || releaseData.sctids.length<1){

                return next("Sctids property cannot be empty.");
            }
            releaseData.author=data.user.name;
            releaseData.model=job.MODELS.SctId;
            bulkDM.saveJob(releaseData,job.JOBTYPE.releaseSctids,function(err,bulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(bulkJobRecord));
            });
        }else
            return next("No permission for the selected operation");
    });
};

module.exports.publishSctids = function publishSctids (req, res, next) {
    var token = req.swagger.params.token.value;
    var publicationData = req.swagger.params.publicationData.value;
    security.authenticate(token, function(err, data) {
        if (err) {
            return next(err.message);
        }
        if (isAbleUser(publicationData.namespace, data.user.name)){
            if (!publicationData.sctids || publicationData.sctids.length<1){

                return next("Sctids property cannot be empty.");
            }
            publicationData.author=data.user.name;
            publicationData.model=job.MODELS.SctId;
            bulkDM.saveJob(publicationData,job.JOBTYPE.publishSctids,function(err,bulkJobRecord){
                if (err) {

                    return next(err.message);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(bulkJobRecord));
            });
        }else
            return next("No permission for the selected operation");
    });
};

var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();