'use strict';
/*
  Copyright (c) IBM Corporation 2017

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific

   Contributors:
     Mark Taylor - Initial Contribution
*/

/*
 * MQSD is a JavaScript object containing the fields we need for the MQSD
 * in a more idiomatic style than the C definition - in particular for
 * fixed length character buffers.
 */

// Import packages for handling structures
var ref        = require('ref');
var StructType = require('ref-struct');
var ArrayType  = require('ref-array');

// Import MQI definitions
var MQC        = require('./mqidefs.js');
var MQT        = require('./mqitypes.js');
var u          = require('./mqiutils.js');

/*
 * This constructor sets default values for the object
 */
exports.MQSD = function() {
  this.Options        = 0;
  this.ObjectName     = null;
  this.AlternateUserId= null;
  this.AlternateSecurityId = Buffer.alloc(MQC.MQ_SECURITY_ID_LENGTH,0);
  this.SubExpiry = MQC.MQEI_UNLIMITED;
  this.ObjectString = null;
  this.SubName = null;
  this.SubUserData = null;
  this.SubCorrelId = Buffer.alloc(MQC.MQ_CORREL_ID_LENGTH);
  this.PubPriority = MQC.MQPRI_PRIORITY_AS_PUBLISHED;
  this.PubAccountingToken = Buffer.alloc(MQC.MQ_ACCOUNTING_TOKEN_LENGTH,0);
  this.PubApplIdentityData = null;

  this.SelectionString = null;
  this.SubLevel = 1;
  this.ResObjectString = null;
  Object.seal(this);
}


/*
 * _MQSDffi_t is the definition directly matching the C structure
 * for the MQSD so it can be used in the FFI call to the MQI.
 * This is not meant to be used publicly.
 */
var _MQSDffi_t = StructType({
       StrucId            : MQT.CHAR4
,      Version            : MQT.LONG
,      Options            : MQT.LONG
,      ObjectName         : MQT.CHAR48
,      AlternateUserId    : MQT.CHAR12
,      AlternateSecurityId: MQT.CHAR40
,      SubExpiry          : MQT.LONG
,      ObjectString       : MQT.CHARV
,      SubName            : MQT.CHARV
,      SubUserData        : MQT.CHARV
,      SubCorrelId        : MQT.BYTE24
,      PubPriority        : MQT.LONG
,      PubAccountingToken : MQT.BYTE32
,      PubApplIdentityData: MQT.CHAR32
,      SelectionString    : MQT.CHARV
,      SubLevel           : MQT.LONG
,      ResObjectString    : MQT.CHARV
});

/*
 * This function creates the C structure analogue, and
 * populates it with default values.
 */
exports._newMQSDffi = function() {
  var sd = new _MQSDffi_t();

  u.setMQIString(sd.StrucId,"SD  ");
  sd.Version     = 1;
  sd.Options     = 0;

  u.setMQIString(sd.ObjectName,"");
  u.setMQIString(sd.AlternateUserId, "");
  u.fillMQIString(sd.AlternateSecurityId,0);
  sd.SubExpiry   =  MQC.MQEI_UNLIMITED;
  u.defaultCharV(sd.ObjectString);
  u.defaultCharV(sd.SubName);
  u.defaultCharV(sd.SubUserData);
  u.fillMQIString(sd.SubCorrelId,0);
  sd.PubPriority        = MQC.MQPRI_PRIORITY_AS_PUBLISHED;
  u.fillMQIString(sd.PubAccountingToken,0);
  u.setMQIString(sd.PubApplIdentityData,"");
  u.defaultCharV(sd.SelectionString);
  sd.SubLevel     = 1;
  u.defaultCharV(sd.ResObjectString);
  return sd
}

/*
 * Copy from the JavaScript version of the MQSD structure
 * into the C version
 */
exports._copySDtoC = function(jssd) {
  var mqsd = exports._newMQSDffi();
  mqsd.Version = 1; // Only version for now
  mqsd.Options = jssd.Options;
  u.setMQIString(mqsd.ObjectName,jssd.ObjectName);
  u.setMQIString(mqsd.AlternateUserId,jssd.AlternateUserId);
  for (var i = 0; i < MQC.MQ_SECURITY_ID_LENGTH && i < jssd.AlternateSecurityId.length; i++) {
    mqsd.AlternateSecurityId[i] = jssd.AlternateSecurityId[i];
  }

  mqsd.SubExpiry = jssd.SubExpiry;
  u.setMQICharV(mqsd.ObjectString, jssd.ObjectString, true);
  u.setMQICharV(mqsd.SubName, jssd.SubName, true);
  u.setMQICharV(mqsd.SubUserData, jssd.SubUserData, true);
  for (var i = 0; i < MQC.MQ_CORREL_ID_LENGTH && i < jssd.SubCorrelId.length; i++) {
    mqsd.SubCorrelId[i] = jssd.SubCorrelId[i];
  }
  mqsd.PubPriority = jssd.PubPriority;
  for (var i = 0; i < MQC.MQ_ACCOUNTING_TOKEN_LENGTH && i < jssd.PubAccountingToken.length; i++) {
    mqsd.PubAccountingToken[i] = jssd.PubAccountingToken[i];
  }
  u.setMQIString(mqsd.PubApplIdentityData,jssd.PubApplIdentityData);
  u.setMQICharV(mqsd.SelectionString, jssd.SelectionString, true);
  mqsd.SubLevel = jssd.SubLevel;
  u.setMQICharV(mqsd.ResObjectString, jssd.ResObjectString, true);

  return mqsd;
}

/*
 * And copy back the fields that might have changed
 */
exports._copySDfromC = function(mqsd,jssd) {
  for (var i = 0; i < MQC.MQ_CORREL_ID_LENGTH && i < jssd.SubCorrelId.length; i++) {
    jssd.SubCorrelId[i] = mqsd.SubCorrelId[i];
  }
  jssd.SubLevel = mqsd.SubLevel;
  for (var i = 0; i < MQC.MQ_ACCOUNTING_TOKEN_LENGTH && i < jssd.PubAccountingToken.length; i++) {
    jssd.PubAccountingToken[i] = mqsd.PubAccountingToken[i];
  }
  jssd.ObjectString = u.getMQICharV(mqsd.ObjectString);
  jssd.SubName      = u.getMQICharV(mqsd.SubName);
  jssd.SubUserData  = u.getMQICharV(mqsd.SubUserData);
  jssd.SelectionString = u.getMQICharV(mqsd.SelectionString);
  jssd.ResObjectString = u.getMQICharV(mqsd.ResObjectString);
  return jssd
}