/**
 * Created by ar on 7/16/15.
 */
var mUse={
    createdProperty: 'created_at',
    modifiedProperty: 'modified_at',
    expireProperty: false,
    dbtype: { type: 'date', time: true },
    now: function() { return new Date(); },
    expire: function() { var d = new Date(); return d.setMinutes(d.getMinutes() + 60); },
    persist: true
};
var sctIdRecord={name: "sctId",
    fields: {
        sctid: { type: 'text', size:18},
        sequence: {type: 'integer', size:8},
        namespace: { type: 'integer'},
        partitionId: String,
        checkDigit: { type: 'integer'},
        systemId:  { type: 'text', size:255, required:true},
        status: String,
        author: String,
        software: String,
        expirationDate: Date,
        comment: String,
        jobId:{ type: 'integer'}
    }, features:{
        id: 'sctid',
        timestamp: true
    }
};

var schemeIdRecord={name: "schemeId",
    fields: {
        scheme: { type: 'text', size:18, key: true},
        schemeId: { type: 'text', size:18, key: true},
        sequence: Number,
        checkDigit: { type: 'integer'},
        systemId: { type: 'text', size:255, required:true},
        status: String,
        author: String,
        software: String,
        expirationDate: Date,
        comment: String,
        jobId:{ type: 'integer'}
    }, features:{
        timestamp: true
    }
};

var schemeIdBaseRecord={name: "schemeIdBase",
    fields: {
        scheme: { type: 'text', size:18, key: true},
        idBase : { type: 'text', size:18}
    }, features:{
        cache: false
    }
};

var namespaceRecord={name: "namespace",
    fields: {
        namespace: { type: 'integer', key: true },
        organizationName: String,
        email: String
    }
};

var partitionRecord={name: "partitions",
    fields: {
        namespace: { type: 'integer', key: true },
        partitionId: { type: 'text', key: true },
        sequence: {type: 'integer', size:8}
    }
    , features:{
        cache: false
    }
};

var permissionsNamespaceRecord={name: "permissionsNamespace",
    fields: {
        namespace: { type: 'integer', key: true },
        username: { type: 'text', key: true },
        role: String
    }
};

var permissionsSchemeRecord={name: "permissionsScheme",
    fields: {
        scheme: { type: 'text', key: true },
        username: { type: 'text', key: true },
        role: String
    }
};

var bulkJobRecord={name: "bulkJob",
    fields: {
        id: {type: 'integer', size:4},
        name: {type: 'text', size:255},
        status: {type: 'text', size: 1},
        request: { type: 'text', size: 1000000 },
        log:{type:'text', size:10000}
    }, features:{
        cache   : false,
        timestamp: true
    }
};

var model={
    bulkJob:bulkJobRecord,
    sctId:sctIdRecord,
    schemeId:schemeIdRecord,
    schemeIdBase:schemeIdBaseRecord,
    namespace:namespaceRecord,
    partitions:partitionRecord,
    permissionsNamespace:permissionsNamespaceRecord,
    permissionsScheme: permissionsSchemeRecord
};

module.exports.mUse=mUse;
module.exports.sctIdRecord=sctIdRecord;
module.exports.model=model;