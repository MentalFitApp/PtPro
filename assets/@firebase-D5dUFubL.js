import{o as cc}from"./idb-BXWtuYvb.js";var Mo={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xa=function(n){const t=[];let e=0;for(let r=0;r<n.length;r++){let s=n.charCodeAt(r);s<128?t[e++]=s:s<2048?(t[e++]=s>>6|192,t[e++]=s&63|128):(s&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++r)&1023),t[e++]=s>>18|240,t[e++]=s>>12&63|128,t[e++]=s>>6&63|128,t[e++]=s&63|128):(t[e++]=s>>12|224,t[e++]=s>>6&63|128,t[e++]=s&63|128)}return t},hc=function(n){const t=[];let e=0,r=0;for(;e<n.length;){const s=n[e++];if(s<128)t[r++]=String.fromCharCode(s);else if(s>191&&s<224){const o=n[e++];t[r++]=String.fromCharCode((s&31)<<6|o&63)}else if(s>239&&s<365){const o=n[e++],a=n[e++],l=n[e++],h=((s&7)<<18|(o&63)<<12|(a&63)<<6|l&63)-65536;t[r++]=String.fromCharCode(55296+(h>>10)),t[r++]=String.fromCharCode(56320+(h&1023))}else{const o=n[e++],a=n[e++];t[r++]=String.fromCharCode((s&15)<<12|(o&63)<<6|a&63)}}return t.join("")},Ma={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,t){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const e=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let s=0;s<n.length;s+=3){const o=n[s],a=s+1<n.length,l=a?n[s+1]:0,h=s+2<n.length,f=h?n[s+2]:0,p=o>>2,E=(o&3)<<4|l>>4;let I=(l&15)<<2|f>>6,P=f&63;h||(P=64,a||(I=64)),r.push(e[p],e[E],e[I],e[P])}return r.join("")},encodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(n):this.encodeByteArray(xa(n),t)},decodeString(n,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(n):hc(this.decodeStringToByteArray(n,t))},decodeStringToByteArray(n,t){this.init_();const e=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let s=0;s<n.length;){const o=e[n.charAt(s++)],l=s<n.length?e[n.charAt(s)]:0;++s;const f=s<n.length?e[n.charAt(s)]:64;++s;const E=s<n.length?e[n.charAt(s)]:64;if(++s,o==null||l==null||f==null||E==null)throw new dc;const I=o<<2|l>>4;if(r.push(I),f!==64){const P=l<<4&240|f>>2;if(r.push(P),E!==64){const V=f<<6&192|E;r.push(V)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class dc extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const fc=function(n){const t=xa(n);return Ma.encodeByteArray(t,!0)},mr=function(n){return fc(n).replace(/\./g,"")},pc=function(n){try{return Ma.decodeString(n,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mc(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gc=()=>mc().__FIREBASE_DEFAULTS__,_c=()=>{if(typeof process>"u"||typeof Mo>"u")return;const n=Mo.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},yc=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=n&&pc(n[1]);return t&&JSON.parse(t)},Rr=()=>{try{return gc()||_c()||yc()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Ec=n=>{var t,e;return(e=(t=Rr())===null||t===void 0?void 0:t.emulatorHosts)===null||e===void 0?void 0:e[n]},La=n=>{const t=Ec(n);if(!t)return;const e=t.lastIndexOf(":");if(e<=0||e+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const r=parseInt(t.substring(e+1),10);return t[0]==="["?[t.substring(1,e-1),r]:[t.substring(0,e),r]},Fa=()=>{var n;return(n=Rr())===null||n===void 0?void 0:n.config},xm=n=>{var t;return(t=Rr())===null||t===void 0?void 0:t[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tc{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(e):t(e,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ua(n,t){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const e={alg:"none",type:"JWT"},r=t||"demo-project",s=n.iat||0,o=n.sub||n.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const a=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:s,exp:s+3600,auth_time:s,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}}},n);return[mr(JSON.stringify(e)),mr(JSON.stringify(a)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function js(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Mm(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(js())}function vc(){var n;const t=(n=Rr())===null||n===void 0?void 0:n.forceEnvironment;if(t==="node")return!0;if(t==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Lm(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Fm(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Um(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Bm(){const n=js();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function wc(){return!vc()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Ic(){try{return typeof indexedDB=="object"}catch{return!1}}function Ac(){return new Promise((n,t)=>{try{let e=!0;const r="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(r);s.onsuccess=()=>{s.result.close(),e||self.indexedDB.deleteDatabase(r),n(!0)},s.onupgradeneeded=()=>{e=!1},s.onerror=()=>{var o;t(((o=s.error)===null||o===void 0?void 0:o.message)||"")}}catch(e){t(e)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rc="FirebaseError";class ye extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name=Rc,Object.setPrototypeOf(this,ye.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,Ba.prototype.create)}}class Ba{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},s=`${this.service}/${t}`,o=this.errors[t],a=o?Pc(o,r):"Error",l=`${this.serviceName}: ${a} (${s}).`;return new ye(s,l,r)}}function Pc(n,t){return n.replace(bc,(e,r)=>{const s=t[r];return s!=null?String(s):`<${r}?>`})}const bc=/\{\$([^}]+)}/g;function qm(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}function vs(n,t){if(n===t)return!0;const e=Object.keys(n),r=Object.keys(t);for(const s of e){if(!r.includes(s))return!1;const o=n[s],a=t[s];if(Lo(o)&&Lo(a)){if(!vs(o,a))return!1}else if(o!==a)return!1}for(const s of r)if(!e.includes(s))return!1;return!0}function Lo(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jm(n){const t=[];for(const[e,r]of Object.entries(n))Array.isArray(r)?r.forEach(s=>{t.push(encodeURIComponent(e)+"="+encodeURIComponent(s))}):t.push(encodeURIComponent(e)+"="+encodeURIComponent(r));return t.length?"&"+t.join("&"):""}function $m(n){const t={};return n.replace(/^\?/,"").split("&").forEach(r=>{if(r){const[s,o]=r.split("=");t[decodeURIComponent(s)]=decodeURIComponent(o)}}),t}function zm(n){const t=n.indexOf("?");if(!t)return"";const e=n.indexOf("#",t);return n.substring(t,e>0?e:void 0)}function Gm(n,t){const e=new Cc(n,t);return e.subscribe.bind(e)}class Cc{constructor(t,e){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=e,this.task.then(()=>{t(this)}).catch(r=>{this.error(r)})}next(t){this.forEachObserver(e=>{e.next(t)})}error(t){this.forEachObserver(e=>{e.error(t)}),this.close(t)}complete(){this.forEachObserver(t=>{t.complete()}),this.close()}subscribe(t,e,r){let s;if(t===void 0&&e===void 0&&r===void 0)throw new Error("Missing Observer.");Sc(t,["next","error","complete"])?s=t:s={next:t,error:e,complete:r},s.next===void 0&&(s.next=ds),s.error===void 0&&(s.error=ds),s.complete===void 0&&(s.complete=ds);const o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),o}unsubscribeOne(t){this.observers===void 0||this.observers[t]===void 0||(delete this.observers[t],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(t){if(!this.finalized)for(let e=0;e<this.observers.length;e++)this.sendOne(e,t)}sendOne(t,e){this.task.then(()=>{if(this.observers!==void 0&&this.observers[t]!==void 0)try{e(this.observers[t])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(t){this.finalized||(this.finalized=!0,t!==void 0&&(this.finalError=t),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Sc(n,t){if(typeof n!="object"||n===null)return!1;for(const e of t)if(e in n&&typeof n[e]=="function")return!0;return!1}function ds(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wt(n){return n&&n._delegate?n._delegate:n}class Ve{constructor(t,e,r){this.name=t,this.instanceFactory=e,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vc{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const e=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(e)){const r=new Tc;if(this.instancesDeferred.set(e,r),this.isInitialized(e)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:e});s&&r.resolve(s)}catch{}}return this.instancesDeferred.get(e).promise}getImmediate(t){var e;const r=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),s=(e=t==null?void 0:t.optional)!==null&&e!==void 0?e:!1;if(this.isInitialized(r)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:r})}catch(o){if(s)return null;throw o}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(kc(t))try{this.getOrInitializeService({instanceIdentifier:le})}catch{}for(const[e,r]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(e);try{const o=this.getOrInitializeService({instanceIdentifier:s});r.resolve(o)}catch{}}}}clearInstance(t=le){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...t.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=le){return this.instances.has(t)}getOptions(t=le){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:r,options:e});for(const[o,a]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(o);r===l&&a.resolve(s)}return s}onInit(t,e){var r;const s=this.normalizeInstanceIdentifier(e),o=(r=this.onInitCallbacks.get(s))!==null&&r!==void 0?r:new Set;o.add(t),this.onInitCallbacks.set(s,o);const a=this.instances.get(s);return a&&t(a,s),()=>{o.delete(t)}}invokeOnInitCallbacks(t,e){const r=this.onInitCallbacks.get(e);if(r)for(const s of r)try{s(t,e)}catch{}}getOrInitializeService({instanceIdentifier:t,options:e={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Dc(t),options:e}),this.instances.set(t,r),this.instancesOptions.set(t,e),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=le){return this.component?this.component.multipleInstances?t:le:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Dc(n){return n===le?void 0:n}function kc(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nc{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new Vc(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var G;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(G||(G={}));const Oc={debug:G.DEBUG,verbose:G.VERBOSE,info:G.INFO,warn:G.WARN,error:G.ERROR,silent:G.SILENT},xc=G.INFO,Mc={[G.DEBUG]:"log",[G.VERBOSE]:"log",[G.INFO]:"info",[G.WARN]:"warn",[G.ERROR]:"error"},Lc=(n,t,...e)=>{if(t<n.logLevel)return;const r=new Date().toISOString(),s=Mc[t];if(s)console[s](`[${r}]  ${n.name}:`,...e);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class qa{constructor(t){this.name=t,this._logLevel=xc,this._logHandler=Lc,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in G))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Oc[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,G.DEBUG,...t),this._logHandler(this,G.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,G.VERBOSE,...t),this._logHandler(this,G.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,G.INFO,...t),this._logHandler(this,G.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,G.WARN,...t),this._logHandler(this,G.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,G.ERROR,...t),this._logHandler(this,G.ERROR,...t)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fc{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(Uc(e)){const r=e.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(e=>e).join(" ")}}function Uc(n){const t=n.getComponent();return(t==null?void 0:t.type)==="VERSION"}const ws="@firebase/app",Fo="0.10.13";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zt=new qa("@firebase/app"),Bc="@firebase/app-compat",qc="@firebase/analytics-compat",jc="@firebase/analytics",$c="@firebase/app-check-compat",zc="@firebase/app-check",Gc="@firebase/auth",Hc="@firebase/auth-compat",Kc="@firebase/database",Wc="@firebase/data-connect",Qc="@firebase/database-compat",Xc="@firebase/functions",Yc="@firebase/functions-compat",Jc="@firebase/installations",Zc="@firebase/installations-compat",th="@firebase/messaging",eh="@firebase/messaging-compat",nh="@firebase/performance",rh="@firebase/performance-compat",sh="@firebase/remote-config",ih="@firebase/remote-config-compat",oh="@firebase/storage",ah="@firebase/storage-compat",uh="@firebase/firestore",lh="@firebase/vertexai-preview",ch="@firebase/firestore-compat",hh="firebase",dh="10.14.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Is="[DEFAULT]",fh={[ws]:"fire-core",[Bc]:"fire-core-compat",[jc]:"fire-analytics",[qc]:"fire-analytics-compat",[zc]:"fire-app-check",[$c]:"fire-app-check-compat",[Gc]:"fire-auth",[Hc]:"fire-auth-compat",[Kc]:"fire-rtdb",[Wc]:"fire-data-connect",[Qc]:"fire-rtdb-compat",[Xc]:"fire-fn",[Yc]:"fire-fn-compat",[Jc]:"fire-iid",[Zc]:"fire-iid-compat",[th]:"fire-fcm",[eh]:"fire-fcm-compat",[nh]:"fire-perf",[rh]:"fire-perf-compat",[sh]:"fire-rc",[ih]:"fire-rc-compat",[oh]:"fire-gcs",[ah]:"fire-gcs-compat",[uh]:"fire-fst",[ch]:"fire-fst-compat",[lh]:"fire-vertex","fire-js":"fire-js",[hh]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const De=new Map,As=new Map,Rs=new Map;function Uo(n,t){try{n.container.addComponent(t)}catch(e){zt.debug(`Component ${t.name} failed to register with FirebaseApp ${n.name}`,e)}}function _n(n){const t=n.name;if(Rs.has(t))return zt.debug(`There were multiple attempts to register component ${t}.`),!1;Rs.set(t,n);for(const e of De.values())Uo(e,n);for(const e of As.values())Uo(e,n);return!0}function ja(n,t){const e=n.container.getProvider("heartbeat").getImmediate({optional:!0});return e&&e.triggerHeartbeat(),n.container.getProvider(t)}function Hm(n){return n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ph={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Zt=new Ba("app","Firebase",ph);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mh{constructor(t,e,r){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},e),this._name=e.name,this._automaticDataCollectionEnabled=e.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new Ve("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw Zt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $a=dh;function gh(n,t={}){let e=n;typeof t!="object"&&(t={name:t});const r=Object.assign({name:Is,automaticDataCollectionEnabled:!1},t),s=r.name;if(typeof s!="string"||!s)throw Zt.create("bad-app-name",{appName:String(s)});if(e||(e=Fa()),!e)throw Zt.create("no-options");const o=De.get(s);if(o){if(vs(e,o.options)&&vs(r,o.config))return o;throw Zt.create("duplicate-app",{appName:s})}const a=new Nc(s);for(const h of Rs.values())a.addComponent(h);const l=new mh(e,r,a);return De.set(s,l),l}function za(n=Is){const t=De.get(n);if(!t&&n===Is&&Fa())return gh();if(!t)throw Zt.create("no-app",{appName:n});return t}async function Km(n){let t=!1;const e=n.name;De.has(e)?(t=!0,De.delete(e)):As.has(e)&&n.decRefCount()<=0&&(As.delete(e),t=!0),t&&(await Promise.all(n.container.getProviders().map(r=>r.delete())),n.isDeleted=!0)}function he(n,t,e){var r;let s=(r=fh[n])!==null&&r!==void 0?r:n;e&&(s+=`-${e}`);const o=s.match(/\s|\//),a=t.match(/\s|\//);if(o||a){const l=[`Unable to register library "${s}" with version "${t}":`];o&&l.push(`library name "${s}" contains illegal characters (whitespace or "/")`),o&&a&&l.push("and"),a&&l.push(`version name "${t}" contains illegal characters (whitespace or "/")`),zt.warn(l.join(" "));return}_n(new Ve(`${s}-version`,()=>({library:s,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _h="firebase-heartbeat-database",yh=1,yn="firebase-heartbeat-store";let fs=null;function Ga(){return fs||(fs=cc(_h,yh,{upgrade:(n,t)=>{switch(t){case 0:try{n.createObjectStore(yn)}catch(e){console.warn(e)}}}}).catch(n=>{throw Zt.create("idb-open",{originalErrorMessage:n.message})})),fs}async function Eh(n){try{const e=(await Ga()).transaction(yn),r=await e.objectStore(yn).get(Ha(n));return await e.done,r}catch(t){if(t instanceof ye)zt.warn(t.message);else{const e=Zt.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});zt.warn(e.message)}}}async function Bo(n,t){try{const r=(await Ga()).transaction(yn,"readwrite");await r.objectStore(yn).put(t,Ha(n)),await r.done}catch(e){if(e instanceof ye)zt.warn(e.message);else{const r=Zt.create("idb-set",{originalErrorMessage:e==null?void 0:e.message});zt.warn(r.message)}}}function Ha(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Th=1024,vh=30*24*60*60*1e3;class wh{constructor(t){this.container=t,this._heartbeatsCache=null;const e=this.container.getProvider("app").getImmediate();this._storage=new Ah(e),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,e;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=qo();return((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(a=>a.date===o)?void 0:(this._heartbeatsCache.heartbeats.push({date:o,agent:s}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(a=>{const l=new Date(a.date).valueOf();return Date.now()-l<=vh}),this._storage.overwrite(this._heartbeatsCache))}catch(r){zt.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=qo(),{heartbeatsToSend:r,unsentEntries:s}=Ih(this._heartbeatsCache.heartbeats),o=mr(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(e){return zt.warn(e),""}}}function qo(){return new Date().toISOString().substring(0,10)}function Ih(n,t=Th){const e=[];let r=n.slice();for(const s of n){const o=e.find(a=>a.agent===s.agent);if(o){if(o.dates.push(s.date),jo(e)>t){o.dates.pop();break}}else if(e.push({agent:s.agent,dates:[s.date]}),jo(e)>t){e.pop();break}r=r.slice(1)}return{heartbeatsToSend:e,unsentEntries:r}}class Ah{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ic()?Ac().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const e=await Eh(this.app);return e!=null&&e.heartbeats?e:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var e;if(await this._canUseIndexedDBPromise){const s=await this.read();return Bo(this.app,{lastSentHeartbeatDate:(e=t.lastSentHeartbeatDate)!==null&&e!==void 0?e:s.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var e;if(await this._canUseIndexedDBPromise){const s=await this.read();return Bo(this.app,{lastSentHeartbeatDate:(e=t.lastSentHeartbeatDate)!==null&&e!==void 0?e:s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...t.heartbeats]})}else return}}function jo(n){return mr(JSON.stringify({version:2,heartbeats:n})).length}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rh(n){_n(new Ve("platform-logger",t=>new Fc(t),"PRIVATE")),_n(new Ve("heartbeat",t=>new wh(t),"PRIVATE")),he(ws,Fo,n),he(ws,Fo,"esm2017"),he("fire-js","")}Rh("");var $o=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var de,Ka;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(v,m){function _(){}_.prototype=m.prototype,v.D=m.prototype,v.prototype=new _,v.prototype.constructor=v,v.C=function(y,T,A){for(var g=Array(arguments.length-2),Bt=2;Bt<arguments.length;Bt++)g[Bt-2]=arguments[Bt];return m.prototype[T].apply(y,g)}}function e(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}t(r,e),r.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(v,m,_){_||(_=0);var y=Array(16);if(typeof m=="string")for(var T=0;16>T;++T)y[T]=m.charCodeAt(_++)|m.charCodeAt(_++)<<8|m.charCodeAt(_++)<<16|m.charCodeAt(_++)<<24;else for(T=0;16>T;++T)y[T]=m[_++]|m[_++]<<8|m[_++]<<16|m[_++]<<24;m=v.g[0],_=v.g[1],T=v.g[2];var A=v.g[3],g=m+(A^_&(T^A))+y[0]+3614090360&4294967295;m=_+(g<<7&4294967295|g>>>25),g=A+(T^m&(_^T))+y[1]+3905402710&4294967295,A=m+(g<<12&4294967295|g>>>20),g=T+(_^A&(m^_))+y[2]+606105819&4294967295,T=A+(g<<17&4294967295|g>>>15),g=_+(m^T&(A^m))+y[3]+3250441966&4294967295,_=T+(g<<22&4294967295|g>>>10),g=m+(A^_&(T^A))+y[4]+4118548399&4294967295,m=_+(g<<7&4294967295|g>>>25),g=A+(T^m&(_^T))+y[5]+1200080426&4294967295,A=m+(g<<12&4294967295|g>>>20),g=T+(_^A&(m^_))+y[6]+2821735955&4294967295,T=A+(g<<17&4294967295|g>>>15),g=_+(m^T&(A^m))+y[7]+4249261313&4294967295,_=T+(g<<22&4294967295|g>>>10),g=m+(A^_&(T^A))+y[8]+1770035416&4294967295,m=_+(g<<7&4294967295|g>>>25),g=A+(T^m&(_^T))+y[9]+2336552879&4294967295,A=m+(g<<12&4294967295|g>>>20),g=T+(_^A&(m^_))+y[10]+4294925233&4294967295,T=A+(g<<17&4294967295|g>>>15),g=_+(m^T&(A^m))+y[11]+2304563134&4294967295,_=T+(g<<22&4294967295|g>>>10),g=m+(A^_&(T^A))+y[12]+1804603682&4294967295,m=_+(g<<7&4294967295|g>>>25),g=A+(T^m&(_^T))+y[13]+4254626195&4294967295,A=m+(g<<12&4294967295|g>>>20),g=T+(_^A&(m^_))+y[14]+2792965006&4294967295,T=A+(g<<17&4294967295|g>>>15),g=_+(m^T&(A^m))+y[15]+1236535329&4294967295,_=T+(g<<22&4294967295|g>>>10),g=m+(T^A&(_^T))+y[1]+4129170786&4294967295,m=_+(g<<5&4294967295|g>>>27),g=A+(_^T&(m^_))+y[6]+3225465664&4294967295,A=m+(g<<9&4294967295|g>>>23),g=T+(m^_&(A^m))+y[11]+643717713&4294967295,T=A+(g<<14&4294967295|g>>>18),g=_+(A^m&(T^A))+y[0]+3921069994&4294967295,_=T+(g<<20&4294967295|g>>>12),g=m+(T^A&(_^T))+y[5]+3593408605&4294967295,m=_+(g<<5&4294967295|g>>>27),g=A+(_^T&(m^_))+y[10]+38016083&4294967295,A=m+(g<<9&4294967295|g>>>23),g=T+(m^_&(A^m))+y[15]+3634488961&4294967295,T=A+(g<<14&4294967295|g>>>18),g=_+(A^m&(T^A))+y[4]+3889429448&4294967295,_=T+(g<<20&4294967295|g>>>12),g=m+(T^A&(_^T))+y[9]+568446438&4294967295,m=_+(g<<5&4294967295|g>>>27),g=A+(_^T&(m^_))+y[14]+3275163606&4294967295,A=m+(g<<9&4294967295|g>>>23),g=T+(m^_&(A^m))+y[3]+4107603335&4294967295,T=A+(g<<14&4294967295|g>>>18),g=_+(A^m&(T^A))+y[8]+1163531501&4294967295,_=T+(g<<20&4294967295|g>>>12),g=m+(T^A&(_^T))+y[13]+2850285829&4294967295,m=_+(g<<5&4294967295|g>>>27),g=A+(_^T&(m^_))+y[2]+4243563512&4294967295,A=m+(g<<9&4294967295|g>>>23),g=T+(m^_&(A^m))+y[7]+1735328473&4294967295,T=A+(g<<14&4294967295|g>>>18),g=_+(A^m&(T^A))+y[12]+2368359562&4294967295,_=T+(g<<20&4294967295|g>>>12),g=m+(_^T^A)+y[5]+4294588738&4294967295,m=_+(g<<4&4294967295|g>>>28),g=A+(m^_^T)+y[8]+2272392833&4294967295,A=m+(g<<11&4294967295|g>>>21),g=T+(A^m^_)+y[11]+1839030562&4294967295,T=A+(g<<16&4294967295|g>>>16),g=_+(T^A^m)+y[14]+4259657740&4294967295,_=T+(g<<23&4294967295|g>>>9),g=m+(_^T^A)+y[1]+2763975236&4294967295,m=_+(g<<4&4294967295|g>>>28),g=A+(m^_^T)+y[4]+1272893353&4294967295,A=m+(g<<11&4294967295|g>>>21),g=T+(A^m^_)+y[7]+4139469664&4294967295,T=A+(g<<16&4294967295|g>>>16),g=_+(T^A^m)+y[10]+3200236656&4294967295,_=T+(g<<23&4294967295|g>>>9),g=m+(_^T^A)+y[13]+681279174&4294967295,m=_+(g<<4&4294967295|g>>>28),g=A+(m^_^T)+y[0]+3936430074&4294967295,A=m+(g<<11&4294967295|g>>>21),g=T+(A^m^_)+y[3]+3572445317&4294967295,T=A+(g<<16&4294967295|g>>>16),g=_+(T^A^m)+y[6]+76029189&4294967295,_=T+(g<<23&4294967295|g>>>9),g=m+(_^T^A)+y[9]+3654602809&4294967295,m=_+(g<<4&4294967295|g>>>28),g=A+(m^_^T)+y[12]+3873151461&4294967295,A=m+(g<<11&4294967295|g>>>21),g=T+(A^m^_)+y[15]+530742520&4294967295,T=A+(g<<16&4294967295|g>>>16),g=_+(T^A^m)+y[2]+3299628645&4294967295,_=T+(g<<23&4294967295|g>>>9),g=m+(T^(_|~A))+y[0]+4096336452&4294967295,m=_+(g<<6&4294967295|g>>>26),g=A+(_^(m|~T))+y[7]+1126891415&4294967295,A=m+(g<<10&4294967295|g>>>22),g=T+(m^(A|~_))+y[14]+2878612391&4294967295,T=A+(g<<15&4294967295|g>>>17),g=_+(A^(T|~m))+y[5]+4237533241&4294967295,_=T+(g<<21&4294967295|g>>>11),g=m+(T^(_|~A))+y[12]+1700485571&4294967295,m=_+(g<<6&4294967295|g>>>26),g=A+(_^(m|~T))+y[3]+2399980690&4294967295,A=m+(g<<10&4294967295|g>>>22),g=T+(m^(A|~_))+y[10]+4293915773&4294967295,T=A+(g<<15&4294967295|g>>>17),g=_+(A^(T|~m))+y[1]+2240044497&4294967295,_=T+(g<<21&4294967295|g>>>11),g=m+(T^(_|~A))+y[8]+1873313359&4294967295,m=_+(g<<6&4294967295|g>>>26),g=A+(_^(m|~T))+y[15]+4264355552&4294967295,A=m+(g<<10&4294967295|g>>>22),g=T+(m^(A|~_))+y[6]+2734768916&4294967295,T=A+(g<<15&4294967295|g>>>17),g=_+(A^(T|~m))+y[13]+1309151649&4294967295,_=T+(g<<21&4294967295|g>>>11),g=m+(T^(_|~A))+y[4]+4149444226&4294967295,m=_+(g<<6&4294967295|g>>>26),g=A+(_^(m|~T))+y[11]+3174756917&4294967295,A=m+(g<<10&4294967295|g>>>22),g=T+(m^(A|~_))+y[2]+718787259&4294967295,T=A+(g<<15&4294967295|g>>>17),g=_+(A^(T|~m))+y[9]+3951481745&4294967295,v.g[0]=v.g[0]+m&4294967295,v.g[1]=v.g[1]+(T+(g<<21&4294967295|g>>>11))&4294967295,v.g[2]=v.g[2]+T&4294967295,v.g[3]=v.g[3]+A&4294967295}r.prototype.u=function(v,m){m===void 0&&(m=v.length);for(var _=m-this.blockSize,y=this.B,T=this.h,A=0;A<m;){if(T==0)for(;A<=_;)s(this,v,A),A+=this.blockSize;if(typeof v=="string"){for(;A<m;)if(y[T++]=v.charCodeAt(A++),T==this.blockSize){s(this,y),T=0;break}}else for(;A<m;)if(y[T++]=v[A++],T==this.blockSize){s(this,y),T=0;break}}this.h=T,this.o+=m},r.prototype.v=function(){var v=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);v[0]=128;for(var m=1;m<v.length-8;++m)v[m]=0;var _=8*this.o;for(m=v.length-8;m<v.length;++m)v[m]=_&255,_/=256;for(this.u(v),v=Array(16),m=_=0;4>m;++m)for(var y=0;32>y;y+=8)v[_++]=this.g[m]>>>y&255;return v};function o(v,m){var _=l;return Object.prototype.hasOwnProperty.call(_,v)?_[v]:_[v]=m(v)}function a(v,m){this.h=m;for(var _=[],y=!0,T=v.length-1;0<=T;T--){var A=v[T]|0;y&&A==m||(_[T]=A,y=!1)}this.g=_}var l={};function h(v){return-128<=v&&128>v?o(v,function(m){return new a([m|0],0>m?-1:0)}):new a([v|0],0>v?-1:0)}function f(v){if(isNaN(v)||!isFinite(v))return E;if(0>v)return S(f(-v));for(var m=[],_=1,y=0;v>=_;y++)m[y]=v/_|0,_*=4294967296;return new a(m,0)}function p(v,m){if(v.length==0)throw Error("number format error: empty string");if(m=m||10,2>m||36<m)throw Error("radix out of range: "+m);if(v.charAt(0)=="-")return S(p(v.substring(1),m));if(0<=v.indexOf("-"))throw Error('number format error: interior "-" character');for(var _=f(Math.pow(m,8)),y=E,T=0;T<v.length;T+=8){var A=Math.min(8,v.length-T),g=parseInt(v.substring(T,T+A),m);8>A?(A=f(Math.pow(m,A)),y=y.j(A).add(f(g))):(y=y.j(_),y=y.add(f(g)))}return y}var E=h(0),I=h(1),P=h(16777216);n=a.prototype,n.m=function(){if(N(this))return-S(this).m();for(var v=0,m=1,_=0;_<this.g.length;_++){var y=this.i(_);v+=(0<=y?y:4294967296+y)*m,m*=4294967296}return v},n.toString=function(v){if(v=v||10,2>v||36<v)throw Error("radix out of range: "+v);if(V(this))return"0";if(N(this))return"-"+S(this).toString(v);for(var m=f(Math.pow(v,6)),_=this,y="";;){var T=z(_,m).g;_=U(_,T.j(m));var A=((0<_.g.length?_.g[0]:_.h)>>>0).toString(v);if(_=T,V(_))return A+y;for(;6>A.length;)A="0"+A;y=A+y}},n.i=function(v){return 0>v?0:v<this.g.length?this.g[v]:this.h};function V(v){if(v.h!=0)return!1;for(var m=0;m<v.g.length;m++)if(v.g[m]!=0)return!1;return!0}function N(v){return v.h==-1}n.l=function(v){return v=U(this,v),N(v)?-1:V(v)?0:1};function S(v){for(var m=v.g.length,_=[],y=0;y<m;y++)_[y]=~v.g[y];return new a(_,~v.h).add(I)}n.abs=function(){return N(this)?S(this):this},n.add=function(v){for(var m=Math.max(this.g.length,v.g.length),_=[],y=0,T=0;T<=m;T++){var A=y+(this.i(T)&65535)+(v.i(T)&65535),g=(A>>>16)+(this.i(T)>>>16)+(v.i(T)>>>16);y=g>>>16,A&=65535,g&=65535,_[T]=g<<16|A}return new a(_,_[_.length-1]&-2147483648?-1:0)};function U(v,m){return v.add(S(m))}n.j=function(v){if(V(this)||V(v))return E;if(N(this))return N(v)?S(this).j(S(v)):S(S(this).j(v));if(N(v))return S(this.j(S(v)));if(0>this.l(P)&&0>v.l(P))return f(this.m()*v.m());for(var m=this.g.length+v.g.length,_=[],y=0;y<2*m;y++)_[y]=0;for(y=0;y<this.g.length;y++)for(var T=0;T<v.g.length;T++){var A=this.i(y)>>>16,g=this.i(y)&65535,Bt=v.i(T)>>>16,je=v.i(T)&65535;_[2*y+2*T]+=g*je,q(_,2*y+2*T),_[2*y+2*T+1]+=A*je,q(_,2*y+2*T+1),_[2*y+2*T+1]+=g*Bt,q(_,2*y+2*T+1),_[2*y+2*T+2]+=A*Bt,q(_,2*y+2*T+2)}for(y=0;y<m;y++)_[y]=_[2*y+1]<<16|_[2*y];for(y=m;y<2*m;y++)_[y]=0;return new a(_,0)};function q(v,m){for(;(v[m]&65535)!=v[m];)v[m+1]+=v[m]>>>16,v[m]&=65535,m++}function B(v,m){this.g=v,this.h=m}function z(v,m){if(V(m))throw Error("division by zero");if(V(v))return new B(E,E);if(N(v))return m=z(S(v),m),new B(S(m.g),S(m.h));if(N(m))return m=z(v,S(m)),new B(S(m.g),m.h);if(30<v.g.length){if(N(v)||N(m))throw Error("slowDivide_ only works with positive integers.");for(var _=I,y=m;0>=y.l(v);)_=bt(_),y=bt(y);var T=nt(_,1),A=nt(y,1);for(y=nt(y,2),_=nt(_,2);!V(y);){var g=A.add(y);0>=g.l(v)&&(T=T.add(_),A=g),y=nt(y,1),_=nt(_,1)}return m=U(v,T.j(m)),new B(T,m)}for(T=E;0<=v.l(m);){for(_=Math.max(1,Math.floor(v.m()/m.m())),y=Math.ceil(Math.log(_)/Math.LN2),y=48>=y?1:Math.pow(2,y-48),A=f(_),g=A.j(m);N(g)||0<g.l(v);)_-=y,A=f(_),g=A.j(m);V(A)&&(A=I),T=T.add(A),v=U(v,g)}return new B(T,v)}n.A=function(v){return z(this,v).h},n.and=function(v){for(var m=Math.max(this.g.length,v.g.length),_=[],y=0;y<m;y++)_[y]=this.i(y)&v.i(y);return new a(_,this.h&v.h)},n.or=function(v){for(var m=Math.max(this.g.length,v.g.length),_=[],y=0;y<m;y++)_[y]=this.i(y)|v.i(y);return new a(_,this.h|v.h)},n.xor=function(v){for(var m=Math.max(this.g.length,v.g.length),_=[],y=0;y<m;y++)_[y]=this.i(y)^v.i(y);return new a(_,this.h^v.h)};function bt(v){for(var m=v.g.length+1,_=[],y=0;y<m;y++)_[y]=v.i(y)<<1|v.i(y-1)>>>31;return new a(_,v.h)}function nt(v,m){var _=m>>5;m%=32;for(var y=v.g.length-_,T=[],A=0;A<y;A++)T[A]=0<m?v.i(A+_)>>>m|v.i(A+_+1)<<32-m:v.i(A+_);return new a(T,v.h)}r.prototype.digest=r.prototype.v,r.prototype.reset=r.prototype.s,r.prototype.update=r.prototype.u,Ka=r,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.A,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=f,a.fromString=p,de=a}).apply(typeof $o<"u"?$o:typeof self<"u"?self:typeof window<"u"?window:{});var sr=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Wa,un,Qa,cr,Ps,Xa,Ya,Ja;(function(){var n,t=typeof Object.defineProperties=="function"?Object.defineProperty:function(i,u,c){return i==Array.prototype||i==Object.prototype||(i[u]=c.value),i};function e(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof sr=="object"&&sr];for(var u=0;u<i.length;++u){var c=i[u];if(c&&c.Math==Math)return c}throw Error("Cannot find global object")}var r=e(this);function s(i,u){if(u)t:{var c=r;i=i.split(".");for(var d=0;d<i.length-1;d++){var w=i[d];if(!(w in c))break t;c=c[w]}i=i[i.length-1],d=c[i],u=u(d),u!=d&&u!=null&&t(c,i,{configurable:!0,writable:!0,value:u})}}function o(i,u){i instanceof String&&(i+="");var c=0,d=!1,w={next:function(){if(!d&&c<i.length){var R=c++;return{value:u(R,i[R]),done:!1}}return d=!0,{done:!0,value:void 0}}};return w[Symbol.iterator]=function(){return w},w}s("Array.prototype.values",function(i){return i||function(){return o(this,function(u,c){return c})}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},l=this||self;function h(i){var u=typeof i;return u=u!="object"?u:i?Array.isArray(i)?"array":u:"null",u=="array"||u=="object"&&typeof i.length=="number"}function f(i){var u=typeof i;return u=="object"&&i!=null||u=="function"}function p(i,u,c){return i.call.apply(i.bind,arguments)}function E(i,u,c){if(!i)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var w=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(w,d),i.apply(u,w)}}return function(){return i.apply(u,arguments)}}function I(i,u,c){return I=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?p:E,I.apply(null,arguments)}function P(i,u){var c=Array.prototype.slice.call(arguments,1);return function(){var d=c.slice();return d.push.apply(d,arguments),i.apply(this,d)}}function V(i,u){function c(){}c.prototype=u.prototype,i.aa=u.prototype,i.prototype=new c,i.prototype.constructor=i,i.Qb=function(d,w,R){for(var D=Array(arguments.length-2),Q=2;Q<arguments.length;Q++)D[Q-2]=arguments[Q];return u.prototype[w].apply(d,D)}}function N(i){const u=i.length;if(0<u){const c=Array(u);for(let d=0;d<u;d++)c[d]=i[d];return c}return[]}function S(i,u){for(let c=1;c<arguments.length;c++){const d=arguments[c];if(h(d)){const w=i.length||0,R=d.length||0;i.length=w+R;for(let D=0;D<R;D++)i[w+D]=d[D]}else i.push(d)}}class U{constructor(u,c){this.i=u,this.j=c,this.h=0,this.g=null}get(){let u;return 0<this.h?(this.h--,u=this.g,this.g=u.next,u.next=null):u=this.i(),u}}function q(i){return/^[\s\xa0]*$/.test(i)}function B(){var i=l.navigator;return i&&(i=i.userAgent)?i:""}function z(i){return z[" "](i),i}z[" "]=function(){};var bt=B().indexOf("Gecko")!=-1&&!(B().toLowerCase().indexOf("webkit")!=-1&&B().indexOf("Edge")==-1)&&!(B().indexOf("Trident")!=-1||B().indexOf("MSIE")!=-1)&&B().indexOf("Edge")==-1;function nt(i,u,c){for(const d in i)u.call(c,i[d],d,i)}function v(i,u){for(const c in i)u.call(void 0,i[c],c,i)}function m(i){const u={};for(const c in i)u[c]=i[c];return u}const _="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function y(i,u){let c,d;for(let w=1;w<arguments.length;w++){d=arguments[w];for(c in d)i[c]=d[c];for(let R=0;R<_.length;R++)c=_[R],Object.prototype.hasOwnProperty.call(d,c)&&(i[c]=d[c])}}function T(i){var u=1;i=i.split(":");const c=[];for(;0<u&&i.length;)c.push(i.shift()),u--;return i.length&&c.push(i.join(":")),c}function A(i){l.setTimeout(()=>{throw i},0)}function g(){var i=jr;let u=null;return i.g&&(u=i.g,i.g=i.g.next,i.g||(i.h=null),u.next=null),u}class Bt{constructor(){this.h=this.g=null}add(u,c){const d=je.get();d.set(u,c),this.h?this.h.next=d:this.g=d,this.h=d}}var je=new U(()=>new Sl,i=>i.reset());class Sl{constructor(){this.next=this.g=this.h=null}set(u,c){this.h=u,this.g=c,this.next=null}reset(){this.next=this.g=this.h=null}}let $e,ze=!1,jr=new Bt,xi=()=>{const i=l.Promise.resolve(void 0);$e=()=>{i.then(Vl)}};var Vl=()=>{for(var i;i=g();){try{i.h.call(i.g)}catch(c){A(c)}var u=je;u.j(i),100>u.h&&(u.h++,i.next=u.g,u.g=i)}ze=!1};function Kt(){this.s=this.s,this.C=this.C}Kt.prototype.s=!1,Kt.prototype.ma=function(){this.s||(this.s=!0,this.N())},Kt.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function ft(i,u){this.type=i,this.g=this.target=u,this.defaultPrevented=!1}ft.prototype.h=function(){this.defaultPrevented=!0};var Dl=function(){if(!l.addEventListener||!Object.defineProperty)return!1;var i=!1,u=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const c=()=>{};l.addEventListener("test",c,u),l.removeEventListener("test",c,u)}catch{}return i}();function Ge(i,u){if(ft.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i){var c=this.type=i.type,d=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;if(this.target=i.target||i.srcElement,this.g=u,u=i.relatedTarget){if(bt){t:{try{z(u.nodeName);var w=!0;break t}catch{}w=!1}w||(u=null)}}else c=="mouseover"?u=i.fromElement:c=="mouseout"&&(u=i.toElement);this.relatedTarget=u,d?(this.clientX=d.clientX!==void 0?d.clientX:d.pageX,this.clientY=d.clientY!==void 0?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=typeof i.pointerType=="string"?i.pointerType:kl[i.pointerType]||"",this.state=i.state,this.i=i,i.defaultPrevented&&Ge.aa.h.call(this)}}V(Ge,ft);var kl={2:"touch",3:"pen",4:"mouse"};Ge.prototype.h=function(){Ge.aa.h.call(this);var i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var Un="closure_listenable_"+(1e6*Math.random()|0),Nl=0;function Ol(i,u,c,d,w){this.listener=i,this.proxy=null,this.src=u,this.type=c,this.capture=!!d,this.ha=w,this.key=++Nl,this.da=this.fa=!1}function Bn(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function qn(i){this.src=i,this.g={},this.h=0}qn.prototype.add=function(i,u,c,d,w){var R=i.toString();i=this.g[R],i||(i=this.g[R]=[],this.h++);var D=zr(i,u,d,w);return-1<D?(u=i[D],c||(u.fa=!1)):(u=new Ol(u,this.src,R,!!d,w),u.fa=c,i.push(u)),u};function $r(i,u){var c=u.type;if(c in i.g){var d=i.g[c],w=Array.prototype.indexOf.call(d,u,void 0),R;(R=0<=w)&&Array.prototype.splice.call(d,w,1),R&&(Bn(u),i.g[c].length==0&&(delete i.g[c],i.h--))}}function zr(i,u,c,d){for(var w=0;w<i.length;++w){var R=i[w];if(!R.da&&R.listener==u&&R.capture==!!c&&R.ha==d)return w}return-1}var Gr="closure_lm_"+(1e6*Math.random()|0),Hr={};function Mi(i,u,c,d,w){if(Array.isArray(u)){for(var R=0;R<u.length;R++)Mi(i,u[R],c,d,w);return null}return c=Ui(c),i&&i[Un]?i.K(u,c,f(d)?!!d.capture:!1,w):xl(i,u,c,!1,d,w)}function xl(i,u,c,d,w,R){if(!u)throw Error("Invalid event type");var D=f(w)?!!w.capture:!!w,Q=Wr(i);if(Q||(i[Gr]=Q=new qn(i)),c=Q.add(u,c,d,D,R),c.proxy)return c;if(d=Ml(),c.proxy=d,d.src=i,d.listener=c,i.addEventListener)Dl||(w=D),w===void 0&&(w=!1),i.addEventListener(u.toString(),d,w);else if(i.attachEvent)i.attachEvent(Fi(u.toString()),d);else if(i.addListener&&i.removeListener)i.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");return c}function Ml(){function i(c){return u.call(i.src,i.listener,c)}const u=Ll;return i}function Li(i,u,c,d,w){if(Array.isArray(u))for(var R=0;R<u.length;R++)Li(i,u[R],c,d,w);else d=f(d)?!!d.capture:!!d,c=Ui(c),i&&i[Un]?(i=i.i,u=String(u).toString(),u in i.g&&(R=i.g[u],c=zr(R,c,d,w),-1<c&&(Bn(R[c]),Array.prototype.splice.call(R,c,1),R.length==0&&(delete i.g[u],i.h--)))):i&&(i=Wr(i))&&(u=i.g[u.toString()],i=-1,u&&(i=zr(u,c,d,w)),(c=-1<i?u[i]:null)&&Kr(c))}function Kr(i){if(typeof i!="number"&&i&&!i.da){var u=i.src;if(u&&u[Un])$r(u.i,i);else{var c=i.type,d=i.proxy;u.removeEventListener?u.removeEventListener(c,d,i.capture):u.detachEvent?u.detachEvent(Fi(c),d):u.addListener&&u.removeListener&&u.removeListener(d),(c=Wr(u))?($r(c,i),c.h==0&&(c.src=null,u[Gr]=null)):Bn(i)}}}function Fi(i){return i in Hr?Hr[i]:Hr[i]="on"+i}function Ll(i,u){if(i.da)i=!0;else{u=new Ge(u,this);var c=i.listener,d=i.ha||i.src;i.fa&&Kr(i),i=c.call(d,u)}return i}function Wr(i){return i=i[Gr],i instanceof qn?i:null}var Qr="__closure_events_fn_"+(1e9*Math.random()>>>0);function Ui(i){return typeof i=="function"?i:(i[Qr]||(i[Qr]=function(u){return i.handleEvent(u)}),i[Qr])}function pt(){Kt.call(this),this.i=new qn(this),this.M=this,this.F=null}V(pt,Kt),pt.prototype[Un]=!0,pt.prototype.removeEventListener=function(i,u,c,d){Li(this,i,u,c,d)};function It(i,u){var c,d=i.F;if(d)for(c=[];d;d=d.F)c.push(d);if(i=i.M,d=u.type||u,typeof u=="string")u=new ft(u,i);else if(u instanceof ft)u.target=u.target||i;else{var w=u;u=new ft(d,i),y(u,w)}if(w=!0,c)for(var R=c.length-1;0<=R;R--){var D=u.g=c[R];w=jn(D,d,!0,u)&&w}if(D=u.g=i,w=jn(D,d,!0,u)&&w,w=jn(D,d,!1,u)&&w,c)for(R=0;R<c.length;R++)D=u.g=c[R],w=jn(D,d,!1,u)&&w}pt.prototype.N=function(){if(pt.aa.N.call(this),this.i){var i=this.i,u;for(u in i.g){for(var c=i.g[u],d=0;d<c.length;d++)Bn(c[d]);delete i.g[u],i.h--}}this.F=null},pt.prototype.K=function(i,u,c,d){return this.i.add(String(i),u,!1,c,d)},pt.prototype.L=function(i,u,c,d){return this.i.add(String(i),u,!0,c,d)};function jn(i,u,c,d){if(u=i.i.g[String(u)],!u)return!0;u=u.concat();for(var w=!0,R=0;R<u.length;++R){var D=u[R];if(D&&!D.da&&D.capture==c){var Q=D.listener,ut=D.ha||D.src;D.fa&&$r(i.i,D),w=Q.call(ut,d)!==!1&&w}}return w&&!d.defaultPrevented}function Bi(i,u,c){if(typeof i=="function")c&&(i=I(i,c));else if(i&&typeof i.handleEvent=="function")i=I(i.handleEvent,i);else throw Error("Invalid listener argument");return 2147483647<Number(u)?-1:l.setTimeout(i,u||0)}function qi(i){i.g=Bi(()=>{i.g=null,i.i&&(i.i=!1,qi(i))},i.l);const u=i.h;i.h=null,i.m.apply(null,u)}class Fl extends Kt{constructor(u,c){super(),this.m=u,this.l=c,this.h=null,this.i=!1,this.g=null}j(u){this.h=arguments,this.g?this.i=!0:qi(this)}N(){super.N(),this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function He(i){Kt.call(this),this.h=i,this.g={}}V(He,Kt);var ji=[];function $i(i){nt(i.g,function(u,c){this.g.hasOwnProperty(c)&&Kr(u)},i),i.g={}}He.prototype.N=function(){He.aa.N.call(this),$i(this)},He.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Xr=l.JSON.stringify,Ul=l.JSON.parse,Bl=class{stringify(i){return l.JSON.stringify(i,void 0)}parse(i){return l.JSON.parse(i,void 0)}};function Yr(){}Yr.prototype.h=null;function zi(i){return i.h||(i.h=i.i())}function Gi(){}var Ke={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function Jr(){ft.call(this,"d")}V(Jr,ft);function Zr(){ft.call(this,"c")}V(Zr,ft);var ie={},Hi=null;function $n(){return Hi=Hi||new pt}ie.La="serverreachability";function Ki(i){ft.call(this,ie.La,i)}V(Ki,ft);function We(i){const u=$n();It(u,new Ki(u))}ie.STAT_EVENT="statevent";function Wi(i,u){ft.call(this,ie.STAT_EVENT,i),this.stat=u}V(Wi,ft);function At(i){const u=$n();It(u,new Wi(u,i))}ie.Ma="timingevent";function Qi(i,u){ft.call(this,ie.Ma,i),this.size=u}V(Qi,ft);function Qe(i,u){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){i()},u)}function Xe(){this.g=!0}Xe.prototype.xa=function(){this.g=!1};function ql(i,u,c,d,w,R){i.info(function(){if(i.g)if(R)for(var D="",Q=R.split("&"),ut=0;ut<Q.length;ut++){var H=Q[ut].split("=");if(1<H.length){var mt=H[0];H=H[1];var gt=mt.split("_");D=2<=gt.length&&gt[1]=="type"?D+(mt+"="+H+"&"):D+(mt+"=redacted&")}}else D=null;else D=R;return"XMLHTTP REQ ("+d+") [attempt "+w+"]: "+u+`
`+c+`
`+D})}function jl(i,u,c,d,w,R,D){i.info(function(){return"XMLHTTP RESP ("+d+") [ attempt "+w+"]: "+u+`
`+c+`
`+R+" "+D})}function we(i,u,c,d){i.info(function(){return"XMLHTTP TEXT ("+u+"): "+zl(i,c)+(d?" "+d:"")})}function $l(i,u){i.info(function(){return"TIMEOUT: "+u})}Xe.prototype.info=function(){};function zl(i,u){if(!i.g)return u;if(!u)return null;try{var c=JSON.parse(u);if(c){for(i=0;i<c.length;i++)if(Array.isArray(c[i])){var d=c[i];if(!(2>d.length)){var w=d[1];if(Array.isArray(w)&&!(1>w.length)){var R=w[0];if(R!="noop"&&R!="stop"&&R!="close")for(var D=1;D<w.length;D++)w[D]=""}}}}return Xr(c)}catch{return u}}var zn={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},Xi={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"},ts;function Gn(){}V(Gn,Yr),Gn.prototype.g=function(){return new XMLHttpRequest},Gn.prototype.i=function(){return{}},ts=new Gn;function Wt(i,u,c,d){this.j=i,this.i=u,this.l=c,this.R=d||1,this.U=new He(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new Yi}function Yi(){this.i=null,this.g="",this.h=!1}var Ji={},es={};function ns(i,u,c){i.L=1,i.v=Qn(qt(u)),i.m=c,i.P=!0,Zi(i,null)}function Zi(i,u){i.F=Date.now(),Hn(i),i.A=qt(i.v);var c=i.A,d=i.R;Array.isArray(d)||(d=[String(d)]),po(c.i,"t",d),i.C=0,c=i.j.J,i.h=new Yi,i.g=ko(i.j,c?u:null,!i.m),0<i.O&&(i.M=new Fl(I(i.Y,i,i.g),i.O)),u=i.U,c=i.g,d=i.ca;var w="readystatechange";Array.isArray(w)||(w&&(ji[0]=w.toString()),w=ji);for(var R=0;R<w.length;R++){var D=Mi(c,w[R],d||u.handleEvent,!1,u.h||u);if(!D)break;u.g[D.key]=D}u=i.H?m(i.H):{},i.m?(i.u||(i.u="POST"),u["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.A,i.u,i.m,u)):(i.u="GET",i.g.ea(i.A,i.u,null,u)),We(),ql(i.i,i.u,i.A,i.l,i.R,i.m)}Wt.prototype.ca=function(i){i=i.target;const u=this.M;u&&jt(i)==3?u.j():this.Y(i)},Wt.prototype.Y=function(i){try{if(i==this.g)t:{const gt=jt(this.g);var u=this.g.Ba();const Re=this.g.Z();if(!(3>gt)&&(gt!=3||this.g&&(this.h.h||this.g.oa()||vo(this.g)))){this.J||gt!=4||u==7||(u==8||0>=Re?We(3):We(2)),rs(this);var c=this.g.Z();this.X=c;e:if(to(this)){var d=vo(this.g);i="";var w=d.length,R=jt(this.g)==4;if(!this.h.i){if(typeof TextDecoder>"u"){oe(this),Ye(this);var D="";break e}this.h.i=new l.TextDecoder}for(u=0;u<w;u++)this.h.h=!0,i+=this.h.i.decode(d[u],{stream:!(R&&u==w-1)});d.length=0,this.h.g+=i,this.C=0,D=this.h.g}else D=this.g.oa();if(this.o=c==200,jl(this.i,this.u,this.A,this.l,this.R,gt,c),this.o){if(this.T&&!this.K){e:{if(this.g){var Q,ut=this.g;if((Q=ut.g?ut.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!q(Q)){var H=Q;break e}}H=null}if(c=H)we(this.i,this.l,c,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,ss(this,c);else{this.o=!1,this.s=3,At(12),oe(this),Ye(this);break t}}if(this.P){c=!0;let kt;for(;!this.J&&this.C<D.length;)if(kt=Gl(this,D),kt==es){gt==4&&(this.s=4,At(14),c=!1),we(this.i,this.l,null,"[Incomplete Response]");break}else if(kt==Ji){this.s=4,At(15),we(this.i,this.l,D,"[Invalid Chunk]"),c=!1;break}else we(this.i,this.l,kt,null),ss(this,kt);if(to(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),gt!=4||D.length!=0||this.h.h||(this.s=1,At(16),c=!1),this.o=this.o&&c,!c)we(this.i,this.l,D,"[Invalid Chunked Response]"),oe(this),Ye(this);else if(0<D.length&&!this.W){this.W=!0;var mt=this.j;mt.g==this&&mt.ba&&!mt.M&&(mt.j.info("Great, no buffering proxy detected. Bytes received: "+D.length),cs(mt),mt.M=!0,At(11))}}else we(this.i,this.l,D,null),ss(this,D);gt==4&&oe(this),this.o&&!this.J&&(gt==4?Co(this.j,this):(this.o=!1,Hn(this)))}else uc(this.g),c==400&&0<D.indexOf("Unknown SID")?(this.s=3,At(12)):(this.s=0,At(13)),oe(this),Ye(this)}}}catch{}finally{}};function to(i){return i.g?i.u=="GET"&&i.L!=2&&i.j.Ca:!1}function Gl(i,u){var c=i.C,d=u.indexOf(`
`,c);return d==-1?es:(c=Number(u.substring(c,d)),isNaN(c)?Ji:(d+=1,d+c>u.length?es:(u=u.slice(d,d+c),i.C=d+c,u)))}Wt.prototype.cancel=function(){this.J=!0,oe(this)};function Hn(i){i.S=Date.now()+i.I,eo(i,i.I)}function eo(i,u){if(i.B!=null)throw Error("WatchDog timer not null");i.B=Qe(I(i.ba,i),u)}function rs(i){i.B&&(l.clearTimeout(i.B),i.B=null)}Wt.prototype.ba=function(){this.B=null;const i=Date.now();0<=i-this.S?($l(this.i,this.A),this.L!=2&&(We(),At(17)),oe(this),this.s=2,Ye(this)):eo(this,this.S-i)};function Ye(i){i.j.G==0||i.J||Co(i.j,i)}function oe(i){rs(i);var u=i.M;u&&typeof u.ma=="function"&&u.ma(),i.M=null,$i(i.U),i.g&&(u=i.g,i.g=null,u.abort(),u.ma())}function ss(i,u){try{var c=i.j;if(c.G!=0&&(c.g==i||is(c.h,i))){if(!i.K&&is(c.h,i)&&c.G==3){try{var d=c.Da.g.parse(u)}catch{d=null}if(Array.isArray(d)&&d.length==3){var w=d;if(w[0]==0){t:if(!c.u){if(c.g)if(c.g.F+3e3<i.F)er(c),Zn(c);else break t;ls(c),At(18)}}else c.za=w[1],0<c.za-c.T&&37500>w[2]&&c.F&&c.v==0&&!c.C&&(c.C=Qe(I(c.Za,c),6e3));if(1>=so(c.h)&&c.ca){try{c.ca()}catch{}c.ca=void 0}}else ue(c,11)}else if((i.K||c.g==i)&&er(c),!q(u))for(w=c.Da.g.parse(u),u=0;u<w.length;u++){let H=w[u];if(c.T=H[0],H=H[1],c.G==2)if(H[0]=="c"){c.K=H[1],c.ia=H[2];const mt=H[3];mt!=null&&(c.la=mt,c.j.info("VER="+c.la));const gt=H[4];gt!=null&&(c.Aa=gt,c.j.info("SVER="+c.Aa));const Re=H[5];Re!=null&&typeof Re=="number"&&0<Re&&(d=1.5*Re,c.L=d,c.j.info("backChannelRequestTimeoutMs_="+d)),d=c;const kt=i.g;if(kt){const rr=kt.g?kt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(rr){var R=d.h;R.g||rr.indexOf("spdy")==-1&&rr.indexOf("quic")==-1&&rr.indexOf("h2")==-1||(R.j=R.l,R.g=new Set,R.h&&(os(R,R.h),R.h=null))}if(d.D){const hs=kt.g?kt.g.getResponseHeader("X-HTTP-Session-Id"):null;hs&&(d.ya=hs,Y(d.I,d.D,hs))}}c.G=3,c.l&&c.l.ua(),c.ba&&(c.R=Date.now()-i.F,c.j.info("Handshake RTT: "+c.R+"ms")),d=c;var D=i;if(d.qa=Do(d,d.J?d.ia:null,d.W),D.K){io(d.h,D);var Q=D,ut=d.L;ut&&(Q.I=ut),Q.B&&(rs(Q),Hn(Q)),d.g=D}else Po(d);0<c.i.length&&tr(c)}else H[0]!="stop"&&H[0]!="close"||ue(c,7);else c.G==3&&(H[0]=="stop"||H[0]=="close"?H[0]=="stop"?ue(c,7):us(c):H[0]!="noop"&&c.l&&c.l.ta(H),c.v=0)}}We(4)}catch{}}var Hl=class{constructor(i,u){this.g=i,this.map=u}};function no(i){this.l=i||10,l.PerformanceNavigationTiming?(i=l.performance.getEntriesByType("navigation"),i=0<i.length&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(l.chrome&&l.chrome.loadTimes&&l.chrome.loadTimes()&&l.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function ro(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function so(i){return i.h?1:i.g?i.g.size:0}function is(i,u){return i.h?i.h==u:i.g?i.g.has(u):!1}function os(i,u){i.g?i.g.add(u):i.h=u}function io(i,u){i.h&&i.h==u?i.h=null:i.g&&i.g.has(u)&&i.g.delete(u)}no.prototype.cancel=function(){if(this.i=oo(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function oo(i){if(i.h!=null)return i.i.concat(i.h.D);if(i.g!=null&&i.g.size!==0){let u=i.i;for(const c of i.g.values())u=u.concat(c.D);return u}return N(i.i)}function Kl(i){if(i.V&&typeof i.V=="function")return i.V();if(typeof Map<"u"&&i instanceof Map||typeof Set<"u"&&i instanceof Set)return Array.from(i.values());if(typeof i=="string")return i.split("");if(h(i)){for(var u=[],c=i.length,d=0;d<c;d++)u.push(i[d]);return u}u=[],c=0;for(d in i)u[c++]=i[d];return u}function Wl(i){if(i.na&&typeof i.na=="function")return i.na();if(!i.V||typeof i.V!="function"){if(typeof Map<"u"&&i instanceof Map)return Array.from(i.keys());if(!(typeof Set<"u"&&i instanceof Set)){if(h(i)||typeof i=="string"){var u=[];i=i.length;for(var c=0;c<i;c++)u.push(c);return u}u=[],c=0;for(const d in i)u[c++]=d;return u}}}function ao(i,u){if(i.forEach&&typeof i.forEach=="function")i.forEach(u,void 0);else if(h(i)||typeof i=="string")Array.prototype.forEach.call(i,u,void 0);else for(var c=Wl(i),d=Kl(i),w=d.length,R=0;R<w;R++)u.call(void 0,d[R],c&&c[R],i)}var uo=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Ql(i,u){if(i){i=i.split("&");for(var c=0;c<i.length;c++){var d=i[c].indexOf("="),w=null;if(0<=d){var R=i[c].substring(0,d);w=i[c].substring(d+1)}else R=i[c];u(R,w?decodeURIComponent(w.replace(/\+/g," ")):"")}}}function ae(i){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,i instanceof ae){this.h=i.h,Kn(this,i.j),this.o=i.o,this.g=i.g,Wn(this,i.s),this.l=i.l;var u=i.i,c=new tn;c.i=u.i,u.g&&(c.g=new Map(u.g),c.h=u.h),lo(this,c),this.m=i.m}else i&&(u=String(i).match(uo))?(this.h=!1,Kn(this,u[1]||"",!0),this.o=Je(u[2]||""),this.g=Je(u[3]||"",!0),Wn(this,u[4]),this.l=Je(u[5]||"",!0),lo(this,u[6]||"",!0),this.m=Je(u[7]||"")):(this.h=!1,this.i=new tn(null,this.h))}ae.prototype.toString=function(){var i=[],u=this.j;u&&i.push(Ze(u,co,!0),":");var c=this.g;return(c||u=="file")&&(i.push("//"),(u=this.o)&&i.push(Ze(u,co,!0),"@"),i.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c=this.s,c!=null&&i.push(":",String(c))),(c=this.l)&&(this.g&&c.charAt(0)!="/"&&i.push("/"),i.push(Ze(c,c.charAt(0)=="/"?Jl:Yl,!0))),(c=this.i.toString())&&i.push("?",c),(c=this.m)&&i.push("#",Ze(c,tc)),i.join("")};function qt(i){return new ae(i)}function Kn(i,u,c){i.j=c?Je(u,!0):u,i.j&&(i.j=i.j.replace(/:$/,""))}function Wn(i,u){if(u){if(u=Number(u),isNaN(u)||0>u)throw Error("Bad port number "+u);i.s=u}else i.s=null}function lo(i,u,c){u instanceof tn?(i.i=u,ec(i.i,i.h)):(c||(u=Ze(u,Zl)),i.i=new tn(u,i.h))}function Y(i,u,c){i.i.set(u,c)}function Qn(i){return Y(i,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),i}function Je(i,u){return i?u?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function Ze(i,u,c){return typeof i=="string"?(i=encodeURI(i).replace(u,Xl),c&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function Xl(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var co=/[#\/\?@]/g,Yl=/[#\?:]/g,Jl=/[#\?]/g,Zl=/[#\?@]/g,tc=/#/g;function tn(i,u){this.h=this.g=null,this.i=i||null,this.j=!!u}function Qt(i){i.g||(i.g=new Map,i.h=0,i.i&&Ql(i.i,function(u,c){i.add(decodeURIComponent(u.replace(/\+/g," ")),c)}))}n=tn.prototype,n.add=function(i,u){Qt(this),this.i=null,i=Ie(this,i);var c=this.g.get(i);return c||this.g.set(i,c=[]),c.push(u),this.h+=1,this};function ho(i,u){Qt(i),u=Ie(i,u),i.g.has(u)&&(i.i=null,i.h-=i.g.get(u).length,i.g.delete(u))}function fo(i,u){return Qt(i),u=Ie(i,u),i.g.has(u)}n.forEach=function(i,u){Qt(this),this.g.forEach(function(c,d){c.forEach(function(w){i.call(u,w,d,this)},this)},this)},n.na=function(){Qt(this);const i=Array.from(this.g.values()),u=Array.from(this.g.keys()),c=[];for(let d=0;d<u.length;d++){const w=i[d];for(let R=0;R<w.length;R++)c.push(u[d])}return c},n.V=function(i){Qt(this);let u=[];if(typeof i=="string")fo(this,i)&&(u=u.concat(this.g.get(Ie(this,i))));else{i=Array.from(this.g.values());for(let c=0;c<i.length;c++)u=u.concat(i[c])}return u},n.set=function(i,u){return Qt(this),this.i=null,i=Ie(this,i),fo(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[u]),this.h+=1,this},n.get=function(i,u){return i?(i=this.V(i),0<i.length?String(i[0]):u):u};function po(i,u,c){ho(i,u),0<c.length&&(i.i=null,i.g.set(Ie(i,u),N(c)),i.h+=c.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],u=Array.from(this.g.keys());for(var c=0;c<u.length;c++){var d=u[c];const R=encodeURIComponent(String(d)),D=this.V(d);for(d=0;d<D.length;d++){var w=R;D[d]!==""&&(w+="="+encodeURIComponent(String(D[d]))),i.push(w)}}return this.i=i.join("&")};function Ie(i,u){return u=String(u),i.j&&(u=u.toLowerCase()),u}function ec(i,u){u&&!i.j&&(Qt(i),i.i=null,i.g.forEach(function(c,d){var w=d.toLowerCase();d!=w&&(ho(this,d),po(this,w,c))},i)),i.j=u}function nc(i,u){const c=new Xe;if(l.Image){const d=new Image;d.onload=P(Xt,c,"TestLoadImage: loaded",!0,u,d),d.onerror=P(Xt,c,"TestLoadImage: error",!1,u,d),d.onabort=P(Xt,c,"TestLoadImage: abort",!1,u,d),d.ontimeout=P(Xt,c,"TestLoadImage: timeout",!1,u,d),l.setTimeout(function(){d.ontimeout&&d.ontimeout()},1e4),d.src=i}else u(!1)}function rc(i,u){const c=new Xe,d=new AbortController,w=setTimeout(()=>{d.abort(),Xt(c,"TestPingServer: timeout",!1,u)},1e4);fetch(i,{signal:d.signal}).then(R=>{clearTimeout(w),R.ok?Xt(c,"TestPingServer: ok",!0,u):Xt(c,"TestPingServer: server error",!1,u)}).catch(()=>{clearTimeout(w),Xt(c,"TestPingServer: error",!1,u)})}function Xt(i,u,c,d,w){try{w&&(w.onload=null,w.onerror=null,w.onabort=null,w.ontimeout=null),d(c)}catch{}}function sc(){this.g=new Bl}function ic(i,u,c){const d=c||"";try{ao(i,function(w,R){let D=w;f(w)&&(D=Xr(w)),u.push(d+R+"="+encodeURIComponent(D))})}catch(w){throw u.push(d+"type="+encodeURIComponent("_badmap")),w}}function Xn(i){this.l=i.Ub||null,this.j=i.eb||!1}V(Xn,Yr),Xn.prototype.g=function(){return new Yn(this.l,this.j)},Xn.prototype.i=function(i){return function(){return i}}({});function Yn(i,u){pt.call(this),this.D=i,this.o=u,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}V(Yn,pt),n=Yn.prototype,n.open=function(i,u){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.B=i,this.A=u,this.readyState=1,nn(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");this.g=!0;const u={headers:this.u,method:this.B,credentials:this.m,cache:void 0};i&&(u.body=i),(this.D||l).fetch(new Request(this.A,u)).then(this.Sa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&this.readyState!=4&&(this.g=!1,en(this)),this.readyState=0},n.Sa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,nn(this)),this.g&&(this.readyState=3,nn(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(typeof l.ReadableStream<"u"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;mo(this)}else i.text().then(this.Ra.bind(this),this.ga.bind(this))};function mo(i){i.j.read().then(i.Pa.bind(i)).catch(i.ga.bind(i))}n.Pa=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var u=i.value?i.value:new Uint8Array(0);(u=this.v.decode(u,{stream:!i.done}))&&(this.response=this.responseText+=u)}i.done?en(this):nn(this),this.readyState==3&&mo(this)}},n.Ra=function(i){this.g&&(this.response=this.responseText=i,en(this))},n.Qa=function(i){this.g&&(this.response=i,en(this))},n.ga=function(){this.g&&en(this)};function en(i){i.readyState=4,i.l=null,i.j=null,i.v=null,nn(i)}n.setRequestHeader=function(i,u){this.u.append(i,u)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],u=this.h.entries();for(var c=u.next();!c.done;)c=c.value,i.push(c[0]+": "+c[1]),c=u.next();return i.join(`\r
`)};function nn(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(Yn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function go(i){let u="";return nt(i,function(c,d){u+=d,u+=":",u+=c,u+=`\r
`}),u}function as(i,u,c){t:{for(d in c){var d=!1;break t}d=!0}d||(c=go(c),typeof i=="string"?c!=null&&encodeURIComponent(String(c)):Y(i,u,c))}function Z(i){pt.call(this),this.headers=new Map,this.o=i||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}V(Z,pt);var oc=/^https?$/i,ac=["POST","PUT"];n=Z.prototype,n.Ha=function(i){this.J=i},n.ea=function(i,u,c,d){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);u=u?u.toUpperCase():"GET",this.D=i,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():ts.g(),this.v=this.o?zi(this.o):zi(ts),this.g.onreadystatechange=I(this.Ea,this);try{this.B=!0,this.g.open(u,String(i),!0),this.B=!1}catch(R){_o(this,R);return}if(i=c||"",c=new Map(this.headers),d)if(Object.getPrototypeOf(d)===Object.prototype)for(var w in d)c.set(w,d[w]);else if(typeof d.keys=="function"&&typeof d.get=="function")for(const R of d.keys())c.set(R,d.get(R));else throw Error("Unknown input type for opt_headers: "+String(d));d=Array.from(c.keys()).find(R=>R.toLowerCase()=="content-type"),w=l.FormData&&i instanceof l.FormData,!(0<=Array.prototype.indexOf.call(ac,u,void 0))||d||w||c.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[R,D]of c)this.g.setRequestHeader(R,D);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{To(this),this.u=!0,this.g.send(i),this.u=!1}catch(R){_o(this,R)}};function _o(i,u){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=u,i.m=5,yo(i),Jn(i)}function yo(i){i.A||(i.A=!0,It(i,"complete"),It(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=i||7,It(this,"complete"),It(this,"abort"),Jn(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Jn(this,!0)),Z.aa.N.call(this)},n.Ea=function(){this.s||(this.B||this.u||this.j?Eo(this):this.bb())},n.bb=function(){Eo(this)};function Eo(i){if(i.h&&typeof a<"u"&&(!i.v[1]||jt(i)!=4||i.Z()!=2)){if(i.u&&jt(i)==4)Bi(i.Ea,0,i);else if(It(i,"readystatechange"),jt(i)==4){i.h=!1;try{const D=i.Z();t:switch(D){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var u=!0;break t;default:u=!1}var c;if(!(c=u)){var d;if(d=D===0){var w=String(i.D).match(uo)[1]||null;!w&&l.self&&l.self.location&&(w=l.self.location.protocol.slice(0,-1)),d=!oc.test(w?w.toLowerCase():"")}c=d}if(c)It(i,"complete"),It(i,"success");else{i.m=6;try{var R=2<jt(i)?i.g.statusText:""}catch{R=""}i.l=R+" ["+i.Z()+"]",yo(i)}}finally{Jn(i)}}}}function Jn(i,u){if(i.g){To(i);const c=i.g,d=i.v[0]?()=>{}:null;i.g=null,i.v=null,u||It(i,"ready");try{c.onreadystatechange=d}catch{}}}function To(i){i.I&&(l.clearTimeout(i.I),i.I=null)}n.isActive=function(){return!!this.g};function jt(i){return i.g?i.g.readyState:0}n.Z=function(){try{return 2<jt(this)?this.g.status:-1}catch{return-1}},n.oa=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.Oa=function(i){if(this.g){var u=this.g.responseText;return i&&u.indexOf(i)==0&&(u=u.substring(i.length)),Ul(u)}};function vo(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.H){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function uc(i){const u={};i=(i.g&&2<=jt(i)&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let d=0;d<i.length;d++){if(q(i[d]))continue;var c=T(i[d]);const w=c[0];if(c=c[1],typeof c!="string")continue;c=c.trim();const R=u[w]||[];u[w]=R,R.push(c)}v(u,function(d){return d.join(", ")})}n.Ba=function(){return this.m},n.Ka=function(){return typeof this.l=="string"?this.l:String(this.l)};function rn(i,u,c){return c&&c.internalChannelParams&&c.internalChannelParams[i]||u}function wo(i){this.Aa=0,this.i=[],this.j=new Xe,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=rn("failFast",!1,i),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=rn("baseRetryDelayMs",5e3,i),this.cb=rn("retryDelaySeedMs",1e4,i),this.Wa=rn("forwardChannelMaxRetries",2,i),this.wa=rn("forwardChannelRequestTimeoutMs",2e4,i),this.pa=i&&i.xmlHttpFactory||void 0,this.Xa=i&&i.Tb||void 0,this.Ca=i&&i.useFetchStreams||!1,this.L=void 0,this.J=i&&i.supportsCrossDomainXhr||!1,this.K="",this.h=new no(i&&i.concurrentRequestLimit),this.Da=new sc,this.P=i&&i.fastHandshake||!1,this.O=i&&i.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=i&&i.Rb||!1,i&&i.xa&&this.j.xa(),i&&i.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&i&&i.detectBufferingProxy||!1,this.ja=void 0,i&&i.longPollingTimeout&&0<i.longPollingTimeout&&(this.ja=i.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}n=wo.prototype,n.la=8,n.G=1,n.connect=function(i,u,c,d){At(0),this.W=i,this.H=u||{},c&&d!==void 0&&(this.H.OSID=c,this.H.OAID=d),this.F=this.X,this.I=Do(this,null,this.W),tr(this)};function us(i){if(Io(i),i.G==3){var u=i.U++,c=qt(i.I);if(Y(c,"SID",i.K),Y(c,"RID",u),Y(c,"TYPE","terminate"),sn(i,c),u=new Wt(i,i.j,u),u.L=2,u.v=Qn(qt(c)),c=!1,l.navigator&&l.navigator.sendBeacon)try{c=l.navigator.sendBeacon(u.v.toString(),"")}catch{}!c&&l.Image&&(new Image().src=u.v,c=!0),c||(u.g=ko(u.j,null),u.g.ea(u.v)),u.F=Date.now(),Hn(u)}Vo(i)}function Zn(i){i.g&&(cs(i),i.g.cancel(),i.g=null)}function Io(i){Zn(i),i.u&&(l.clearTimeout(i.u),i.u=null),er(i),i.h.cancel(),i.s&&(typeof i.s=="number"&&l.clearTimeout(i.s),i.s=null)}function tr(i){if(!ro(i.h)&&!i.s){i.s=!0;var u=i.Ga;$e||xi(),ze||($e(),ze=!0),jr.add(u,i),i.B=0}}function lc(i,u){return so(i.h)>=i.h.j-(i.s?1:0)?!1:i.s?(i.i=u.D.concat(i.i),!0):i.G==1||i.G==2||i.B>=(i.Va?0:i.Wa)?!1:(i.s=Qe(I(i.Ga,i,u),So(i,i.B)),i.B++,!0)}n.Ga=function(i){if(this.s)if(this.s=null,this.G==1){if(!i){this.U=Math.floor(1e5*Math.random()),i=this.U++;const w=new Wt(this,this.j,i);let R=this.o;if(this.S&&(R?(R=m(R),y(R,this.S)):R=this.S),this.m!==null||this.O||(w.H=R,R=null),this.P)t:{for(var u=0,c=0;c<this.i.length;c++){e:{var d=this.i[c];if("__data__"in d.map&&(d=d.map.__data__,typeof d=="string")){d=d.length;break e}d=void 0}if(d===void 0)break;if(u+=d,4096<u){u=c;break t}if(u===4096||c===this.i.length-1){u=c+1;break t}}u=1e3}else u=1e3;u=Ro(this,w,u),c=qt(this.I),Y(c,"RID",i),Y(c,"CVER",22),this.D&&Y(c,"X-HTTP-Session-Id",this.D),sn(this,c),R&&(this.O?u="headers="+encodeURIComponent(String(go(R)))+"&"+u:this.m&&as(c,this.m,R)),os(this.h,w),this.Ua&&Y(c,"TYPE","init"),this.P?(Y(c,"$req",u),Y(c,"SID","null"),w.T=!0,ns(w,c,null)):ns(w,c,u),this.G=2}}else this.G==3&&(i?Ao(this,i):this.i.length==0||ro(this.h)||Ao(this))};function Ao(i,u){var c;u?c=u.l:c=i.U++;const d=qt(i.I);Y(d,"SID",i.K),Y(d,"RID",c),Y(d,"AID",i.T),sn(i,d),i.m&&i.o&&as(d,i.m,i.o),c=new Wt(i,i.j,c,i.B+1),i.m===null&&(c.H=i.o),u&&(i.i=u.D.concat(i.i)),u=Ro(i,c,1e3),c.I=Math.round(.5*i.wa)+Math.round(.5*i.wa*Math.random()),os(i.h,c),ns(c,d,u)}function sn(i,u){i.H&&nt(i.H,function(c,d){Y(u,d,c)}),i.l&&ao({},function(c,d){Y(u,d,c)})}function Ro(i,u,c){c=Math.min(i.i.length,c);var d=i.l?I(i.l.Na,i.l,i):null;t:{var w=i.i;let R=-1;for(;;){const D=["count="+c];R==-1?0<c?(R=w[0].g,D.push("ofs="+R)):R=0:D.push("ofs="+R);let Q=!0;for(let ut=0;ut<c;ut++){let H=w[ut].g;const mt=w[ut].map;if(H-=R,0>H)R=Math.max(0,w[ut].g-100),Q=!1;else try{ic(mt,D,"req"+H+"_")}catch{d&&d(mt)}}if(Q){d=D.join("&");break t}}}return i=i.i.splice(0,c),u.D=i,d}function Po(i){if(!i.g&&!i.u){i.Y=1;var u=i.Fa;$e||xi(),ze||($e(),ze=!0),jr.add(u,i),i.v=0}}function ls(i){return i.g||i.u||3<=i.v?!1:(i.Y++,i.u=Qe(I(i.Fa,i),So(i,i.v)),i.v++,!0)}n.Fa=function(){if(this.u=null,bo(this),this.ba&&!(this.M||this.g==null||0>=this.R)){var i=2*this.R;this.j.info("BP detection timer enabled: "+i),this.A=Qe(I(this.ab,this),i)}},n.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,At(10),Zn(this),bo(this))};function cs(i){i.A!=null&&(l.clearTimeout(i.A),i.A=null)}function bo(i){i.g=new Wt(i,i.j,"rpc",i.Y),i.m===null&&(i.g.H=i.o),i.g.O=0;var u=qt(i.qa);Y(u,"RID","rpc"),Y(u,"SID",i.K),Y(u,"AID",i.T),Y(u,"CI",i.F?"0":"1"),!i.F&&i.ja&&Y(u,"TO",i.ja),Y(u,"TYPE","xmlhttp"),sn(i,u),i.m&&i.o&&as(u,i.m,i.o),i.L&&(i.g.I=i.L);var c=i.g;i=i.ia,c.L=1,c.v=Qn(qt(u)),c.m=null,c.P=!0,Zi(c,i)}n.Za=function(){this.C!=null&&(this.C=null,Zn(this),ls(this),At(19))};function er(i){i.C!=null&&(l.clearTimeout(i.C),i.C=null)}function Co(i,u){var c=null;if(i.g==u){er(i),cs(i),i.g=null;var d=2}else if(is(i.h,u))c=u.D,io(i.h,u),d=1;else return;if(i.G!=0){if(u.o)if(d==1){c=u.m?u.m.length:0,u=Date.now()-u.F;var w=i.B;d=$n(),It(d,new Qi(d,c)),tr(i)}else Po(i);else if(w=u.s,w==3||w==0&&0<u.X||!(d==1&&lc(i,u)||d==2&&ls(i)))switch(c&&0<c.length&&(u=i.h,u.i=u.i.concat(c)),w){case 1:ue(i,5);break;case 4:ue(i,10);break;case 3:ue(i,6);break;default:ue(i,2)}}}function So(i,u){let c=i.Ta+Math.floor(Math.random()*i.cb);return i.isActive()||(c*=2),c*u}function ue(i,u){if(i.j.info("Error code "+u),u==2){var c=I(i.fb,i),d=i.Xa;const w=!d;d=new ae(d||"//www.google.com/images/cleardot.gif"),l.location&&l.location.protocol=="http"||Kn(d,"https"),Qn(d),w?nc(d.toString(),c):rc(d.toString(),c)}else At(2);i.G=0,i.l&&i.l.sa(u),Vo(i),Io(i)}n.fb=function(i){i?(this.j.info("Successfully pinged google.com"),At(2)):(this.j.info("Failed to ping google.com"),At(1))};function Vo(i){if(i.G=0,i.ka=[],i.l){const u=oo(i.h);(u.length!=0||i.i.length!=0)&&(S(i.ka,u),S(i.ka,i.i),i.h.i.length=0,N(i.i),i.i.length=0),i.l.ra()}}function Do(i,u,c){var d=c instanceof ae?qt(c):new ae(c);if(d.g!="")u&&(d.g=u+"."+d.g),Wn(d,d.s);else{var w=l.location;d=w.protocol,u=u?u+"."+w.hostname:w.hostname,w=+w.port;var R=new ae(null);d&&Kn(R,d),u&&(R.g=u),w&&Wn(R,w),c&&(R.l=c),d=R}return c=i.D,u=i.ya,c&&u&&Y(d,c,u),Y(d,"VER",i.la),sn(i,d),d}function ko(i,u,c){if(u&&!i.J)throw Error("Can't create secondary domain capable XhrIo object.");return u=i.Ca&&!i.pa?new Z(new Xn({eb:c})):new Z(i.pa),u.Ha(i.J),u}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function No(){}n=No.prototype,n.ua=function(){},n.ta=function(){},n.sa=function(){},n.ra=function(){},n.isActive=function(){return!0},n.Na=function(){};function nr(){}nr.prototype.g=function(i,u){return new St(i,u)};function St(i,u){pt.call(this),this.g=new wo(u),this.l=i,this.h=u&&u.messageUrlParams||null,i=u&&u.messageHeaders||null,u&&u.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=u&&u.initMessageHeaders||null,u&&u.messageContentType&&(i?i["X-WebChannel-Content-Type"]=u.messageContentType:i={"X-WebChannel-Content-Type":u.messageContentType}),u&&u.va&&(i?i["X-WebChannel-Client-Profile"]=u.va:i={"X-WebChannel-Client-Profile":u.va}),this.g.S=i,(i=u&&u.Sb)&&!q(i)&&(this.g.m=i),this.v=u&&u.supportsCrossDomainXhr||!1,this.u=u&&u.sendRawJson||!1,(u=u&&u.httpSessionIdParam)&&!q(u)&&(this.g.D=u,i=this.h,i!==null&&u in i&&(i=this.h,u in i&&delete i[u])),this.j=new Ae(this)}V(St,pt),St.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},St.prototype.close=function(){us(this.g)},St.prototype.o=function(i){var u=this.g;if(typeof i=="string"){var c={};c.__data__=i,i=c}else this.u&&(c={},c.__data__=Xr(i),i=c);u.i.push(new Hl(u.Ya++,i)),u.G==3&&tr(u)},St.prototype.N=function(){this.g.l=null,delete this.j,us(this.g),delete this.g,St.aa.N.call(this)};function Oo(i){Jr.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var u=i.__sm__;if(u){t:{for(const c in u){i=c;break t}i=void 0}(this.i=i)&&(i=this.i,u=u!==null&&i in u?u[i]:void 0),this.data=u}else this.data=i}V(Oo,Jr);function xo(){Zr.call(this),this.status=1}V(xo,Zr);function Ae(i){this.g=i}V(Ae,No),Ae.prototype.ua=function(){It(this.g,"a")},Ae.prototype.ta=function(i){It(this.g,new Oo(i))},Ae.prototype.sa=function(i){It(this.g,new xo)},Ae.prototype.ra=function(){It(this.g,"b")},nr.prototype.createWebChannel=nr.prototype.g,St.prototype.send=St.prototype.o,St.prototype.open=St.prototype.m,St.prototype.close=St.prototype.close,Ja=function(){return new nr},Ya=function(){return $n()},Xa=ie,Ps={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},zn.NO_ERROR=0,zn.TIMEOUT=8,zn.HTTP_ERROR=6,cr=zn,Xi.COMPLETE="complete",Qa=Xi,Gi.EventType=Ke,Ke.OPEN="a",Ke.CLOSE="b",Ke.ERROR="c",Ke.MESSAGE="d",pt.prototype.listen=pt.prototype.K,un=Gi,Z.prototype.listenOnce=Z.prototype.L,Z.prototype.getLastError=Z.prototype.Ka,Z.prototype.getLastErrorCode=Z.prototype.Ba,Z.prototype.getStatus=Z.prototype.Z,Z.prototype.getResponseJson=Z.prototype.Oa,Z.prototype.getResponseText=Z.prototype.oa,Z.prototype.send=Z.prototype.ea,Z.prototype.setWithCredentials=Z.prototype.Ha,Wa=Z}).apply(typeof sr<"u"?sr:typeof self<"u"?self:typeof window<"u"?window:{});const zo="@firebase/firestore";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}yt.UNAUTHENTICATED=new yt(null),yt.GOOGLE_CREDENTIALS=new yt("google-credentials-uid"),yt.FIRST_PARTY=new yt("first-party-uid"),yt.MOCK_USER=new yt("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ue="10.14.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pe=new qa("@firebase/firestore");function on(){return pe.logLevel}function O(n,...t){if(pe.logLevel<=G.DEBUG){const e=t.map($s);pe.debug(`Firestore (${Ue}): ${n}`,...e)}}function Gt(n,...t){if(pe.logLevel<=G.ERROR){const e=t.map($s);pe.error(`Firestore (${Ue}): ${n}`,...e)}}function ke(n,...t){if(pe.logLevel<=G.WARN){const e=t.map($s);pe.warn(`Firestore (${Ue}): ${n}`,...e)}}function $s(n){if(typeof n=="string")return n;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return function(e){return JSON.stringify(e)}(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(n="Unexpected state"){const t=`FIRESTORE (${Ue}) INTERNAL ASSERTION FAILED: `+n;throw Gt(t),new Error(t)}function W(n,t){n||M()}function F(n,t){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class k extends ye{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $t{constructor(){this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Za{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class Ph{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable(()=>e(yt.UNAUTHENTICATED))}shutdown(){}}class bh{constructor(t){this.token=t,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable(()=>e(this.token.user))}shutdown(){this.changeListener=null}}class Ch{constructor(t){this.t=t,this.currentUser=yt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){W(this.o===void 0);let r=this.i;const s=h=>this.i!==r?(r=this.i,e(h)):Promise.resolve();let o=new $t;this.o=()=>{this.i++,this.currentUser=this.u(),o.resolve(),o=new $t,t.enqueueRetryable(()=>s(this.currentUser))};const a=()=>{const h=o;t.enqueueRetryable(async()=>{await h.promise,await s(this.currentUser)})},l=h=>{O("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=h,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit(h=>l(h)),setTimeout(()=>{if(!this.auth){const h=this.t.getImmediate({optional:!0});h?l(h):(O("FirebaseAuthCredentialsProvider","Auth not yet detected"),o.resolve(),o=new $t)}},0),a()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then(r=>this.i!==t?(O("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(W(typeof r.accessToken=="string"),new Za(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return W(t===null||typeof t=="string"),new yt(t)}}class Sh{constructor(t,e,r){this.l=t,this.h=e,this.P=r,this.type="FirstParty",this.user=yt.FIRST_PARTY,this.I=new Map}T(){return this.P?this.P():null}get headers(){this.I.set("X-Goog-AuthUser",this.l);const t=this.T();return t&&this.I.set("Authorization",t),this.h&&this.I.set("X-Goog-Iam-Authorization-Token",this.h),this.I}}class Vh{constructor(t,e,r){this.l=t,this.h=e,this.P=r}getToken(){return Promise.resolve(new Sh(this.l,this.h,this.P))}start(t,e){t.enqueueRetryable(()=>e(yt.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class Dh{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class kh{constructor(t){this.A=t,this.forceRefresh=!1,this.appCheck=null,this.R=null}start(t,e){W(this.o===void 0);const r=o=>{o.error!=null&&O("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${o.error.message}`);const a=o.token!==this.R;return this.R=o.token,O("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?e(o.token):Promise.resolve()};this.o=o=>{t.enqueueRetryable(()=>r(o))};const s=o=>{O("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=o,this.o&&this.appCheck.addTokenListener(this.o)};this.A.onInit(o=>s(o)),setTimeout(()=>{if(!this.appCheck){const o=this.A.getImmediate({optional:!0});o?s(o):O("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then(e=>e?(W(typeof e.token=="string"),this.R=e.token,new Dh(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nh(n){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(n);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let r=0;r<n;r++)e[r]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tu{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=Math.floor(256/t.length)*t.length;let r="";for(;r.length<20;){const s=Nh(40);for(let o=0;o<s.length;++o)r.length<20&&s[o]<e&&(r+=t.charAt(s[o]%t.length))}return r}}function K(n,t){return n<t?-1:n>t?1:0}function Ne(n,t,e){return n.length===t.length&&n.every((r,s)=>e(r,t[s]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new k(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new k(b.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<-62135596800)throw new k(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new k(b.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}static now(){return ot.fromMillis(Date.now())}static fromDate(t){return ot.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),r=Math.floor(1e6*(t-1e3*e));return new ot(e,r)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/1e6}_compareTo(t){return this.seconds===t.seconds?K(this.nanoseconds,t.nanoseconds):K(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{seconds:this.seconds,nanoseconds:this.nanoseconds}}valueOf(){const t=this.seconds- -62135596800;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L{constructor(t){this.timestamp=t}static fromTimestamp(t){return new L(t)}static min(){return new L(new ot(0,0))}static max(){return new L(new ot(253402300799,999999999))}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class En{constructor(t,e,r){e===void 0?e=0:e>t.length&&M(),r===void 0?r=t.length-e:r>t.length-e&&M(),this.segments=t,this.offset=e,this.len=r}get length(){return this.len}isEqual(t){return En.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof En?t.forEach(r=>{e.push(r)}):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,r=this.limit();e<r;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const r=Math.min(t.length,e.length);for(let s=0;s<r;s++){const o=t.get(s),a=e.get(s);if(o<a)return-1;if(o>a)return 1}return t.length<e.length?-1:t.length>e.length?1:0}}class X extends En{construct(t,e,r){return new X(t,e,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const r of t){if(r.indexOf("//")>=0)throw new k(b.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);e.push(...r.split("/").filter(s=>s.length>0))}return new X(e)}static emptyPath(){return new X([])}}const Oh=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class ct extends En{construct(t,e,r){return new ct(t,e,r)}static isValidIdentifier(t){return Oh.test(t)}canonicalString(){return this.toArray().map(t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ct.isValidIdentifier(t)||(t="`"+t+"`"),t)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)==="__name__"}static keyField(){return new ct(["__name__"])}static fromServerFormat(t){const e=[];let r="",s=0;const o=()=>{if(r.length===0)throw new k(b.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(r),r=""};let a=!1;for(;s<t.length;){const l=t[s];if(l==="\\"){if(s+1===t.length)throw new k(b.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const h=t[s+1];if(h!=="\\"&&h!=="."&&h!=="`")throw new k(b.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);r+=h,s+=2}else l==="`"?(a=!a,s++):l!=="."||a?(r+=l,s++):(o(),s++)}if(o(),a)throw new k(b.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new ct(e)}static emptyPath(){return new ct([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class x{constructor(t){this.path=t}static fromPath(t){return new x(X.fromString(t))}static fromName(t){return new x(X.fromString(t).popFirst(5))}static empty(){return new x(X.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&X.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return X.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new x(new X(t.slice()))}}function xh(n,t){const e=n.toTimestamp().seconds,r=n.toTimestamp().nanoseconds+1,s=L.fromTimestamp(r===1e9?new ot(e+1,0):new ot(e,r));return new ee(s,x.empty(),t)}function Mh(n){return new ee(n.readTime,n.key,-1)}class ee{constructor(t,e,r){this.readTime=t,this.documentKey=e,this.largestBatchId=r}static min(){return new ee(L.min(),x.empty(),-1)}static max(){return new ee(L.max(),x.empty(),-1)}}function Lh(n,t){let e=n.readTime.compareTo(t.readTime);return e!==0?e:(e=x.comparator(n.documentKey,t.documentKey),e!==0?e:K(n.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fh="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Uh{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(t=>t())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function bn(n){if(n.code!==b.FAILED_PRECONDITION||n.message!==Fh)throw n;O("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class C{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&M(),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new C((r,s)=>{this.nextCallback=o=>{this.wrapSuccess(t,o).next(r,s)},this.catchCallback=o=>{this.wrapFailure(e,o).next(r,s)}})}toPromise(){return new Promise((t,e)=>{this.next(t,e)})}wrapUserFunction(t){try{const e=t();return e instanceof C?e:C.resolve(e)}catch(e){return C.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction(()=>t(e)):C.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction(()=>t(e)):C.reject(e)}static resolve(t){return new C((e,r)=>{e(t)})}static reject(t){return new C((e,r)=>{r(t)})}static waitFor(t){return new C((e,r)=>{let s=0,o=0,a=!1;t.forEach(l=>{++s,l.next(()=>{++o,a&&o===s&&e()},h=>r(h))}),a=!0,o===s&&e()})}static or(t){let e=C.resolve(!1);for(const r of t)e=e.next(s=>s?C.resolve(s):r());return e}static forEach(t,e){const r=[];return t.forEach((s,o)=>{r.push(e.call(this,s,o))}),this.waitFor(r)}static mapArray(t,e){return new C((r,s)=>{const o=t.length,a=new Array(o);let l=0;for(let h=0;h<o;h++){const f=h;e(t[f]).next(p=>{a[f]=p,++l,l===o&&r(a)},p=>s(p))}})}static doWhile(t,e){return new C((r,s)=>{const o=()=>{t()===!0?e().next(()=>{o()},s):r()};o()})}}function Bh(n){const t=n.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}function Cn(n){return n.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=r=>this.ie(r),this.se=r=>e.writeSequenceNumber(r))}ie(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.se&&this.se(t),t}}zs.oe=-1;function Pr(n){return n==null}function gr(n){return n===0&&1/n==-1/0}function qh(n){return typeof n=="number"&&Number.isInteger(n)&&!gr(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Go(n){let t=0;for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t++;return t}function Ee(n,t){for(const e in n)Object.prototype.hasOwnProperty.call(n,e)&&t(e,n[e])}function eu(n){for(const t in n)if(Object.prototype.hasOwnProperty.call(n,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class J{constructor(t,e){this.comparator=t,this.root=e||lt.EMPTY}insert(t,e){return new J(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,lt.BLACK,null,null))}remove(t){return new J(this.comparator,this.root.remove(t,this.comparator).copy(null,null,lt.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const r=this.comparator(t,e.key);if(r===0)return e.value;r<0?e=e.left:r>0&&(e=e.right)}return null}indexOf(t){let e=0,r=this.root;for(;!r.isEmpty();){const s=this.comparator(t,r.key);if(s===0)return e+r.left.size;s<0?r=r.left:(e+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal((e,r)=>(t(e,r),!1))}toString(){const t=[];return this.inorderTraversal((e,r)=>(t.push(`${e}:${r}`),!1)),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new ir(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new ir(this.root,t,this.comparator,!1)}getReverseIterator(){return new ir(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new ir(this.root,t,this.comparator,!0)}}class ir{constructor(t,e,r,s){this.isReverse=s,this.nodeStack=[];let o=1;for(;!t.isEmpty();)if(o=e?r(t.key,e):1,e&&s&&(o*=-1),o<0)t=this.isReverse?t.left:t.right;else{if(o===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class lt{constructor(t,e,r,s,o){this.key=t,this.value=e,this.color=r??lt.RED,this.left=s??lt.EMPTY,this.right=o??lt.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,r,s,o){return new lt(t??this.key,e??this.value,r??this.color,s??this.left,o??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,r){let s=this;const o=r(t,s.key);return s=o<0?s.copy(null,null,null,s.left.insert(t,e,r),null):o===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,r)),s.fixUp()}removeMin(){if(this.left.isEmpty())return lt.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let r,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return lt.EMPTY;r=s.right.min(),s=s.copy(r.key,r.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,lt.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,lt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed()||this.right.isRed())throw M();const t=this.left.check();if(t!==this.right.check())throw M();return t+(this.isRed()?0:1)}}lt.EMPTY=null,lt.RED=!0,lt.BLACK=!1;lt.EMPTY=new class{constructor(){this.size=0}get key(){throw M()}get value(){throw M()}get color(){throw M()}get left(){throw M()}get right(){throw M()}copy(t,e,r,s,o){return this}insert(t,e,r){return new lt(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(t){this.comparator=t,this.data=new J(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal((e,r)=>(t(e),!1))}forEachInRange(t,e){const r=this.data.getIteratorFrom(t[0]);for(;r.hasNext();){const s=r.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let r;for(r=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();r.hasNext();)if(!t(r.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Ho(this.data.getIterator())}getIteratorFrom(t){return new Ho(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach(r=>{e=e.add(r)}),e}isEqual(t){if(!(t instanceof ht)||this.size!==t.size)return!1;const e=this.data.getIterator(),r=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(this.comparator(s,o)!==0)return!1}return!0}toArray(){const t=[];return this.forEach(e=>{t.push(e)}),t}toString(){const t=[];return this.forEach(e=>t.push(e)),"SortedSet("+t.toString()+")"}copy(t){const e=new ht(this.comparator);return e.data=t,e}}class Ho{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(t){this.fields=t,t.sort(ct.comparator)}static empty(){return new Vt([])}unionWith(t){let e=new ht(ct.comparator);for(const r of this.fields)e=e.add(r);for(const r of t)e=e.add(r);return new Vt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return Ne(this.fields,t.fields,(e,r)=>e.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nu extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dt{constructor(t){this.binaryString=t}static fromBase64String(t){const e=function(s){try{return atob(s)}catch(o){throw typeof DOMException<"u"&&o instanceof DOMException?new nu("Invalid base64 string: "+o):o}}(t);return new dt(e)}static fromUint8Array(t){const e=function(s){let o="";for(let a=0;a<s.length;++a)o+=String.fromCharCode(s[a]);return o}(t);return new dt(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return K(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}dt.EMPTY_BYTE_STRING=new dt("");const jh=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function ne(n){if(W(!!n),typeof n=="string"){let t=0;const e=jh.exec(n);if(W(!!e),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:rt(n.seconds),nanos:rt(n.nanos)}}function rt(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function me(n){return typeof n=="string"?dt.fromBase64String(n):dt.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gs(n){var t,e;return((e=(((t=n==null?void 0:n.mapValue)===null||t===void 0?void 0:t.fields)||{}).__type__)===null||e===void 0?void 0:e.stringValue)==="server_timestamp"}function Hs(n){const t=n.mapValue.fields.__previous_value__;return Gs(t)?Hs(t):t}function Tn(n){const t=ne(n.mapValue.fields.__local_write_time__.timestampValue);return new ot(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $h{constructor(t,e,r,s,o,a,l,h,f){this.databaseId=t,this.appId=e,this.persistenceKey=r,this.host=s,this.ssl=o,this.forceLongPolling=a,this.autoDetectLongPolling=l,this.longPollingOptions=h,this.useFetchStreams=f}}class vn{constructor(t,e){this.projectId=t,this.database=e||"(default)"}static empty(){return new vn("","")}get isDefaultDatabase(){return this.database==="(default)"}isEqual(t){return t instanceof vn&&t.projectId===this.projectId&&t.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const or={mapValue:{}};function ge(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?Gs(n)?4:Gh(n)?9007199254740991:zh(n)?10:11:M()}function Lt(n,t){if(n===t)return!0;const e=ge(n);if(e!==ge(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===t.booleanValue;case 4:return Tn(n).isEqual(Tn(t));case 3:return function(s,o){if(typeof s.timestampValue=="string"&&typeof o.timestampValue=="string"&&s.timestampValue.length===o.timestampValue.length)return s.timestampValue===o.timestampValue;const a=ne(s.timestampValue),l=ne(o.timestampValue);return a.seconds===l.seconds&&a.nanos===l.nanos}(n,t);case 5:return n.stringValue===t.stringValue;case 6:return function(s,o){return me(s.bytesValue).isEqual(me(o.bytesValue))}(n,t);case 7:return n.referenceValue===t.referenceValue;case 8:return function(s,o){return rt(s.geoPointValue.latitude)===rt(o.geoPointValue.latitude)&&rt(s.geoPointValue.longitude)===rt(o.geoPointValue.longitude)}(n,t);case 2:return function(s,o){if("integerValue"in s&&"integerValue"in o)return rt(s.integerValue)===rt(o.integerValue);if("doubleValue"in s&&"doubleValue"in o){const a=rt(s.doubleValue),l=rt(o.doubleValue);return a===l?gr(a)===gr(l):isNaN(a)&&isNaN(l)}return!1}(n,t);case 9:return Ne(n.arrayValue.values||[],t.arrayValue.values||[],Lt);case 10:case 11:return function(s,o){const a=s.mapValue.fields||{},l=o.mapValue.fields||{};if(Go(a)!==Go(l))return!1;for(const h in a)if(a.hasOwnProperty(h)&&(l[h]===void 0||!Lt(a[h],l[h])))return!1;return!0}(n,t);default:return M()}}function wn(n,t){return(n.values||[]).find(e=>Lt(e,t))!==void 0}function Oe(n,t){if(n===t)return 0;const e=ge(n),r=ge(t);if(e!==r)return K(e,r);switch(e){case 0:case 9007199254740991:return 0;case 1:return K(n.booleanValue,t.booleanValue);case 2:return function(o,a){const l=rt(o.integerValue||o.doubleValue),h=rt(a.integerValue||a.doubleValue);return l<h?-1:l>h?1:l===h?0:isNaN(l)?isNaN(h)?0:-1:1}(n,t);case 3:return Ko(n.timestampValue,t.timestampValue);case 4:return Ko(Tn(n),Tn(t));case 5:return K(n.stringValue,t.stringValue);case 6:return function(o,a){const l=me(o),h=me(a);return l.compareTo(h)}(n.bytesValue,t.bytesValue);case 7:return function(o,a){const l=o.split("/"),h=a.split("/");for(let f=0;f<l.length&&f<h.length;f++){const p=K(l[f],h[f]);if(p!==0)return p}return K(l.length,h.length)}(n.referenceValue,t.referenceValue);case 8:return function(o,a){const l=K(rt(o.latitude),rt(a.latitude));return l!==0?l:K(rt(o.longitude),rt(a.longitude))}(n.geoPointValue,t.geoPointValue);case 9:return Wo(n.arrayValue,t.arrayValue);case 10:return function(o,a){var l,h,f,p;const E=o.fields||{},I=a.fields||{},P=(l=E.value)===null||l===void 0?void 0:l.arrayValue,V=(h=I.value)===null||h===void 0?void 0:h.arrayValue,N=K(((f=P==null?void 0:P.values)===null||f===void 0?void 0:f.length)||0,((p=V==null?void 0:V.values)===null||p===void 0?void 0:p.length)||0);return N!==0?N:Wo(P,V)}(n.mapValue,t.mapValue);case 11:return function(o,a){if(o===or.mapValue&&a===or.mapValue)return 0;if(o===or.mapValue)return 1;if(a===or.mapValue)return-1;const l=o.fields||{},h=Object.keys(l),f=a.fields||{},p=Object.keys(f);h.sort(),p.sort();for(let E=0;E<h.length&&E<p.length;++E){const I=K(h[E],p[E]);if(I!==0)return I;const P=Oe(l[h[E]],f[p[E]]);if(P!==0)return P}return K(h.length,p.length)}(n.mapValue,t.mapValue);default:throw M()}}function Ko(n,t){if(typeof n=="string"&&typeof t=="string"&&n.length===t.length)return K(n,t);const e=ne(n),r=ne(t),s=K(e.seconds,r.seconds);return s!==0?s:K(e.nanos,r.nanos)}function Wo(n,t){const e=n.values||[],r=t.values||[];for(let s=0;s<e.length&&s<r.length;++s){const o=Oe(e[s],r[s]);if(o)return o}return K(e.length,r.length)}function xe(n){return bs(n)}function bs(n){return"nullValue"in n?"null":"booleanValue"in n?""+n.booleanValue:"integerValue"in n?""+n.integerValue:"doubleValue"in n?""+n.doubleValue:"timestampValue"in n?function(e){const r=ne(e);return`time(${r.seconds},${r.nanos})`}(n.timestampValue):"stringValue"in n?n.stringValue:"bytesValue"in n?function(e){return me(e).toBase64()}(n.bytesValue):"referenceValue"in n?function(e){return x.fromName(e).toString()}(n.referenceValue):"geoPointValue"in n?function(e){return`geo(${e.latitude},${e.longitude})`}(n.geoPointValue):"arrayValue"in n?function(e){let r="[",s=!0;for(const o of e.values||[])s?s=!1:r+=",",r+=bs(o);return r+"]"}(n.arrayValue):"mapValue"in n?function(e){const r=Object.keys(e.fields||{}).sort();let s="{",o=!0;for(const a of r)o?o=!1:s+=",",s+=`${a}:${bs(e.fields[a])}`;return s+"}"}(n.mapValue):M()}function Qo(n,t){return{referenceValue:`projects/${n.projectId}/databases/${n.database}/documents/${t.path.canonicalString()}`}}function Cs(n){return!!n&&"integerValue"in n}function Ks(n){return!!n&&"arrayValue"in n}function Xo(n){return!!n&&"nullValue"in n}function Yo(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function hr(n){return!!n&&"mapValue"in n}function zh(n){var t,e;return((e=(((t=n==null?void 0:n.mapValue)===null||t===void 0?void 0:t.fields)||{}).__type__)===null||e===void 0?void 0:e.stringValue)==="__vector__"}function dn(n){if(n.geoPointValue)return{geoPointValue:Object.assign({},n.geoPointValue)};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:Object.assign({},n.timestampValue)};if(n.mapValue){const t={mapValue:{fields:{}}};return Ee(n.mapValue.fields,(e,r)=>t.mapValue.fields[e]=dn(r)),t}if(n.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(n.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=dn(n.arrayValue.values[e]);return t}return Object.assign({},n)}function Gh(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue==="__max__"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(t){this.value=t}static empty(){return new Ct({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let r=0;r<t.length-1;++r)if(e=(e.mapValue.fields||{})[t.get(r)],!hr(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=dn(e)}setAll(t){let e=ct.emptyPath(),r={},s=[];t.forEach((a,l)=>{if(!e.isImmediateParentOf(l)){const h=this.getFieldsMap(e);this.applyChanges(h,r,s),r={},s=[],e=l.popLast()}a?r[l.lastSegment()]=dn(a):s.push(l.lastSegment())});const o=this.getFieldsMap(e);this.applyChanges(o,r,s)}delete(t){const e=this.field(t.popLast());hr(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Lt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let r=0;r<t.length;++r){let s=e.mapValue.fields[t.get(r)];hr(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(r)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,r){Ee(e,(s,o)=>t[s]=o);for(const s of r)delete t[s]}clone(){return new Ct(dn(this.value))}}function ru(n){const t=[];return Ee(n.fields,(e,r)=>{const s=new ct([e]);if(hr(r)){const o=ru(r.mapValue).fields;if(o.length===0)t.push(s);else for(const a of o)t.push(s.child(a))}else t.push(s)}),new Vt(t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Et{constructor(t,e,r,s,o,a,l){this.key=t,this.documentType=e,this.version=r,this.readTime=s,this.createTime=o,this.data=a,this.documentState=l}static newInvalidDocument(t){return new Et(t,0,L.min(),L.min(),L.min(),Ct.empty(),0)}static newFoundDocument(t,e,r,s){return new Et(t,1,e,L.min(),r,s,0)}static newNoDocument(t,e){return new Et(t,2,e,L.min(),L.min(),Ct.empty(),0)}static newUnknownDocument(t,e){return new Et(t,3,e,L.min(),L.min(),Ct.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(L.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Ct.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Ct.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=L.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof Et&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new Et(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _r{constructor(t,e){this.position=t,this.inclusive=e}}function Jo(n,t,e){let r=0;for(let s=0;s<n.position.length;s++){const o=t[s],a=n.position[s];if(o.field.isKeyField()?r=x.comparator(x.fromName(a.referenceValue),e.key):r=Oe(a,e.data.field(o.field)),o.dir==="desc"&&(r*=-1),r!==0)break}return r}function Zo(n,t){if(n===null)return t===null;if(t===null||n.inclusive!==t.inclusive||n.position.length!==t.position.length)return!1;for(let e=0;e<n.position.length;e++)if(!Lt(n.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class In{constructor(t,e="asc"){this.field=t,this.dir=e}}function Hh(n,t){return n.dir===t.dir&&n.field.isEqual(t.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class su{}class it extends su{constructor(t,e,r){super(),this.field=t,this.op=e,this.value=r}static create(t,e,r){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,r):new Wh(t,e,r):e==="array-contains"?new Yh(t,r):e==="in"?new Jh(t,r):e==="not-in"?new Zh(t,r):e==="array-contains-any"?new td(t,r):new it(t,e,r)}static createKeyFieldInFilter(t,e,r){return e==="in"?new Qh(t,r):new Xh(t,r)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&this.matchesComparison(Oe(e,this.value)):e!==null&&ge(this.value)===ge(e)&&this.matchesComparison(Oe(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return M()}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class Nt extends su{constructor(t,e){super(),this.filters=t,this.op=e,this.ae=null}static create(t,e){return new Nt(t,e)}matches(t){return iu(this)?this.filters.find(e=>!e.matches(t))===void 0:this.filters.find(e=>e.matches(t))!==void 0}getFlattenedFilters(){return this.ae!==null||(this.ae=this.filters.reduce((t,e)=>t.concat(e.getFlattenedFilters()),[])),this.ae}getFilters(){return Object.assign([],this.filters)}}function iu(n){return n.op==="and"}function ou(n){return Kh(n)&&iu(n)}function Kh(n){for(const t of n.filters)if(t instanceof Nt)return!1;return!0}function Ss(n){if(n instanceof it)return n.field.canonicalString()+n.op.toString()+xe(n.value);if(ou(n))return n.filters.map(t=>Ss(t)).join(",");{const t=n.filters.map(e=>Ss(e)).join(",");return`${n.op}(${t})`}}function au(n,t){return n instanceof it?function(r,s){return s instanceof it&&r.op===s.op&&r.field.isEqual(s.field)&&Lt(r.value,s.value)}(n,t):n instanceof Nt?function(r,s){return s instanceof Nt&&r.op===s.op&&r.filters.length===s.filters.length?r.filters.reduce((o,a,l)=>o&&au(a,s.filters[l]),!0):!1}(n,t):void M()}function uu(n){return n instanceof it?function(e){return`${e.field.canonicalString()} ${e.op} ${xe(e.value)}`}(n):n instanceof Nt?function(e){return e.op.toString()+" {"+e.getFilters().map(uu).join(" ,")+"}"}(n):"Filter"}class Wh extends it{constructor(t,e,r){super(t,e,r),this.key=x.fromName(r.referenceValue)}matches(t){const e=x.comparator(t.key,this.key);return this.matchesComparison(e)}}class Qh extends it{constructor(t,e){super(t,"in",e),this.keys=lu("in",e)}matches(t){return this.keys.some(e=>e.isEqual(t.key))}}class Xh extends it{constructor(t,e){super(t,"not-in",e),this.keys=lu("not-in",e)}matches(t){return!this.keys.some(e=>e.isEqual(t.key))}}function lu(n,t){var e;return(((e=t.arrayValue)===null||e===void 0?void 0:e.values)||[]).map(r=>x.fromName(r.referenceValue))}class Yh extends it{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Ks(e)&&wn(e.arrayValue,this.value)}}class Jh extends it{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&wn(this.value.arrayValue,e)}}class Zh extends it{constructor(t,e){super(t,"not-in",e)}matches(t){if(wn(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&!wn(this.value.arrayValue,e)}}class td extends it{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Ks(e)||!e.arrayValue.values)&&e.arrayValue.values.some(r=>wn(this.value.arrayValue,r))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ed{constructor(t,e=null,r=[],s=[],o=null,a=null,l=null){this.path=t,this.collectionGroup=e,this.orderBy=r,this.filters=s,this.limit=o,this.startAt=a,this.endAt=l,this.ue=null}}function ta(n,t=null,e=[],r=[],s=null,o=null,a=null){return new ed(n,t,e,r,s,o,a)}function Ws(n){const t=F(n);if(t.ue===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(r=>Ss(r)).join(","),e+="|ob:",e+=t.orderBy.map(r=>function(o){return o.field.canonicalString()+o.dir}(r)).join(","),Pr(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(r=>xe(r)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(r=>xe(r)).join(",")),t.ue=e}return t.ue}function Qs(n,t){if(n.limit!==t.limit||n.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<n.orderBy.length;e++)if(!Hh(n.orderBy[e],t.orderBy[e]))return!1;if(n.filters.length!==t.filters.length)return!1;for(let e=0;e<n.filters.length;e++)if(!au(n.filters[e],t.filters[e]))return!1;return n.collectionGroup===t.collectionGroup&&!!n.path.isEqual(t.path)&&!!Zo(n.startAt,t.startAt)&&Zo(n.endAt,t.endAt)}function Vs(n){return x.isDocumentKey(n.path)&&n.collectionGroup===null&&n.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(t,e=null,r=[],s=[],o=null,a="F",l=null,h=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=r,this.filters=s,this.limit=o,this.limitType=a,this.startAt=l,this.endAt=h,this.ce=null,this.le=null,this.he=null,this.startAt,this.endAt}}function nd(n,t,e,r,s,o,a,l){return new Te(n,t,e,r,s,o,a,l)}function br(n){return new Te(n)}function ea(n){return n.filters.length===0&&n.limit===null&&n.startAt==null&&n.endAt==null&&(n.explicitOrderBy.length===0||n.explicitOrderBy.length===1&&n.explicitOrderBy[0].field.isKeyField())}function cu(n){return n.collectionGroup!==null}function fn(n){const t=F(n);if(t.ce===null){t.ce=[];const e=new Set;for(const o of t.explicitOrderBy)t.ce.push(o),e.add(o.field.canonicalString());const r=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(a){let l=new ht(ct.comparator);return a.filters.forEach(h=>{h.getFlattenedFilters().forEach(f=>{f.isInequality()&&(l=l.add(f.field))})}),l})(t).forEach(o=>{e.has(o.canonicalString())||o.isKeyField()||t.ce.push(new In(o,r))}),e.has(ct.keyField().canonicalString())||t.ce.push(new In(ct.keyField(),r))}return t.ce}function xt(n){const t=F(n);return t.le||(t.le=rd(t,fn(n))),t.le}function rd(n,t){if(n.limitType==="F")return ta(n.path,n.collectionGroup,t,n.filters,n.limit,n.startAt,n.endAt);{t=t.map(s=>{const o=s.dir==="desc"?"asc":"desc";return new In(s.field,o)});const e=n.endAt?new _r(n.endAt.position,n.endAt.inclusive):null,r=n.startAt?new _r(n.startAt.position,n.startAt.inclusive):null;return ta(n.path,n.collectionGroup,t,n.filters,n.limit,e,r)}}function Ds(n,t){const e=n.filters.concat([t]);return new Te(n.path,n.collectionGroup,n.explicitOrderBy.slice(),e,n.limit,n.limitType,n.startAt,n.endAt)}function yr(n,t,e){return new Te(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),t,e,n.startAt,n.endAt)}function Cr(n,t){return Qs(xt(n),xt(t))&&n.limitType===t.limitType}function hu(n){return`${Ws(xt(n))}|lt:${n.limitType}`}function Pe(n){return`Query(target=${function(e){let r=e.path.canonicalString();return e.collectionGroup!==null&&(r+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(r+=`, filters: [${e.filters.map(s=>uu(s)).join(", ")}]`),Pr(e.limit)||(r+=", limit: "+e.limit),e.orderBy.length>0&&(r+=`, orderBy: [${e.orderBy.map(s=>function(a){return`${a.field.canonicalString()} (${a.dir})`}(s)).join(", ")}]`),e.startAt&&(r+=", startAt: ",r+=e.startAt.inclusive?"b:":"a:",r+=e.startAt.position.map(s=>xe(s)).join(",")),e.endAt&&(r+=", endAt: ",r+=e.endAt.inclusive?"a:":"b:",r+=e.endAt.position.map(s=>xe(s)).join(",")),`Target(${r})`}(xt(n))}; limitType=${n.limitType})`}function Sr(n,t){return t.isFoundDocument()&&function(r,s){const o=s.key.path;return r.collectionGroup!==null?s.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(o):x.isDocumentKey(r.path)?r.path.isEqual(o):r.path.isImmediateParentOf(o)}(n,t)&&function(r,s){for(const o of fn(r))if(!o.field.isKeyField()&&s.data.field(o.field)===null)return!1;return!0}(n,t)&&function(r,s){for(const o of r.filters)if(!o.matches(s))return!1;return!0}(n,t)&&function(r,s){return!(r.startAt&&!function(a,l,h){const f=Jo(a,l,h);return a.inclusive?f<=0:f<0}(r.startAt,fn(r),s)||r.endAt&&!function(a,l,h){const f=Jo(a,l,h);return a.inclusive?f>=0:f>0}(r.endAt,fn(r),s))}(n,t)}function sd(n){return n.collectionGroup||(n.path.length%2==1?n.path.lastSegment():n.path.get(n.path.length-2))}function du(n){return(t,e)=>{let r=!1;for(const s of fn(n)){const o=id(s,t,e);if(o!==0)return o;r=r||s.field.isKeyField()}return 0}}function id(n,t,e){const r=n.field.isKeyField()?x.comparator(t.key,e.key):function(o,a,l){const h=a.data.field(o),f=l.data.field(o);return h!==null&&f!==null?Oe(h,f):M()}(n.field,t,e);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return M()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Be{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r!==void 0){for(const[s,o]of r)if(this.equalsFn(s,t))return o}}has(t){return this.get(t)!==void 0}set(t,e){const r=this.mapKeyFn(t),s=this.inner[r];if(s===void 0)return this.inner[r]=[[t,e]],void this.innerSize++;for(let o=0;o<s.length;o++)if(this.equalsFn(s[o][0],t))return void(s[o]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),r=this.inner[e];if(r===void 0)return!1;for(let s=0;s<r.length;s++)if(this.equalsFn(r[s][0],t))return r.length===1?delete this.inner[e]:r.splice(s,1),this.innerSize--,!0;return!1}forEach(t){Ee(this.inner,(e,r)=>{for(const[s,o]of r)t(s,o)})}isEmpty(){return eu(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const od=new J(x.comparator);function Ht(){return od}const fu=new J(x.comparator);function ln(...n){let t=fu;for(const e of n)t=t.insert(e.key,e);return t}function pu(n){let t=fu;return n.forEach((e,r)=>t=t.insert(e,r.overlayedDocument)),t}function ce(){return pn()}function mu(){return pn()}function pn(){return new Be(n=>n.toString(),(n,t)=>n.isEqual(t))}const ad=new J(x.comparator),ud=new ht(x.comparator);function j(...n){let t=ud;for(const e of n)t=t.add(e);return t}const ld=new ht(K);function cd(){return ld}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xs(n,t){if(n.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:gr(t)?"-0":t}}function gu(n){return{integerValue:""+n}}function hd(n,t){return qh(t)?gu(t):Xs(n,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vr{constructor(){this._=void 0}}function dd(n,t,e){return n instanceof An?function(s,o){const a={fields:{__type__:{stringValue:"server_timestamp"},__local_write_time__:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return o&&Gs(o)&&(o=Hs(o)),o&&(a.fields.__previous_value__=o),{mapValue:a}}(e,t):n instanceof Rn?yu(n,t):n instanceof Pn?Eu(n,t):function(s,o){const a=_u(s,o),l=na(a)+na(s.Pe);return Cs(a)&&Cs(s.Pe)?gu(l):Xs(s.serializer,l)}(n,t)}function fd(n,t,e){return n instanceof Rn?yu(n,t):n instanceof Pn?Eu(n,t):e}function _u(n,t){return n instanceof Er?function(r){return Cs(r)||function(o){return!!o&&"doubleValue"in o}(r)}(t)?t:{integerValue:0}:null}class An extends Vr{}class Rn extends Vr{constructor(t){super(),this.elements=t}}function yu(n,t){const e=Tu(t);for(const r of n.elements)e.some(s=>Lt(s,r))||e.push(r);return{arrayValue:{values:e}}}class Pn extends Vr{constructor(t){super(),this.elements=t}}function Eu(n,t){let e=Tu(t);for(const r of n.elements)e=e.filter(s=>!Lt(s,r));return{arrayValue:{values:e}}}class Er extends Vr{constructor(t,e){super(),this.serializer=t,this.Pe=e}}function na(n){return rt(n.integerValue||n.doubleValue)}function Tu(n){return Ks(n)&&n.arrayValue.values?n.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pd{constructor(t,e){this.field=t,this.transform=e}}function md(n,t){return n.field.isEqual(t.field)&&function(r,s){return r instanceof Rn&&s instanceof Rn||r instanceof Pn&&s instanceof Pn?Ne(r.elements,s.elements,Lt):r instanceof Er&&s instanceof Er?Lt(r.Pe,s.Pe):r instanceof An&&s instanceof An}(n.transform,t.transform)}class gd{constructor(t,e){this.version=t,this.transformResults=e}}class Pt{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new Pt}static exists(t){return new Pt(void 0,t)}static updateTime(t){return new Pt(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function dr(n,t){return n.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(n.updateTime):n.exists===void 0||n.exists===t.isFoundDocument()}class Dr{}function vu(n,t){if(!n.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return n.isNoDocument()?new kr(n.key,Pt.none()):new Sn(n.key,n.data,Pt.none());{const e=n.data,r=Ct.empty();let s=new ht(ct.comparator);for(let o of t.fields)if(!s.has(o)){let a=e.field(o);a===null&&o.length>1&&(o=o.popLast(),a=e.field(o)),a===null?r.delete(o):r.set(o,a),s=s.add(o)}return new se(n.key,r,new Vt(s.toArray()),Pt.none())}}function _d(n,t,e){n instanceof Sn?function(s,o,a){const l=s.value.clone(),h=sa(s.fieldTransforms,o,a.transformResults);l.setAll(h),o.convertToFoundDocument(a.version,l).setHasCommittedMutations()}(n,t,e):n instanceof se?function(s,o,a){if(!dr(s.precondition,o))return void o.convertToUnknownDocument(a.version);const l=sa(s.fieldTransforms,o,a.transformResults),h=o.data;h.setAll(wu(s)),h.setAll(l),o.convertToFoundDocument(a.version,h).setHasCommittedMutations()}(n,t,e):function(s,o,a){o.convertToNoDocument(a.version).setHasCommittedMutations()}(0,t,e)}function mn(n,t,e,r){return n instanceof Sn?function(o,a,l,h){if(!dr(o.precondition,a))return l;const f=o.value.clone(),p=ia(o.fieldTransforms,h,a);return f.setAll(p),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),null}(n,t,e,r):n instanceof se?function(o,a,l,h){if(!dr(o.precondition,a))return l;const f=ia(o.fieldTransforms,h,a),p=a.data;return p.setAll(wu(o)),p.setAll(f),a.convertToFoundDocument(a.version,p).setHasLocalMutations(),l===null?null:l.unionWith(o.fieldMask.fields).unionWith(o.fieldTransforms.map(E=>E.field))}(n,t,e,r):function(o,a,l){return dr(o.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):l}(n,t,e)}function yd(n,t){let e=null;for(const r of n.fieldTransforms){const s=t.data.field(r.field),o=_u(r.transform,s||null);o!=null&&(e===null&&(e=Ct.empty()),e.set(r.field,o))}return e||null}function ra(n,t){return n.type===t.type&&!!n.key.isEqual(t.key)&&!!n.precondition.isEqual(t.precondition)&&!!function(r,s){return r===void 0&&s===void 0||!(!r||!s)&&Ne(r,s,(o,a)=>md(o,a))}(n.fieldTransforms,t.fieldTransforms)&&(n.type===0?n.value.isEqual(t.value):n.type!==1||n.data.isEqual(t.data)&&n.fieldMask.isEqual(t.fieldMask))}class Sn extends Dr{constructor(t,e,r,s=[]){super(),this.key=t,this.value=e,this.precondition=r,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class se extends Dr{constructor(t,e,r,s,o=[]){super(),this.key=t,this.data=e,this.fieldMask=r,this.precondition=s,this.fieldTransforms=o,this.type=1}getFieldMask(){return this.fieldMask}}function wu(n){const t=new Map;return n.fieldMask.fields.forEach(e=>{if(!e.isEmpty()){const r=n.data.field(e);t.set(e,r)}}),t}function sa(n,t,e){const r=new Map;W(n.length===e.length);for(let s=0;s<e.length;s++){const o=n[s],a=o.transform,l=t.data.field(o.field);r.set(o.field,fd(a,l,e[s]))}return r}function ia(n,t,e){const r=new Map;for(const s of n){const o=s.transform,a=e.data.field(s.field);r.set(s.field,dd(o,a,t))}return r}class kr extends Dr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Ed extends Dr{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Td{constructor(t,e,r,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=r,this.mutations=s}applyToRemoteDocument(t,e){const r=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const o=this.mutations[s];o.key.isEqual(t.key)&&_d(o,t,r[s])}}applyToLocalView(t,e){for(const r of this.baseMutations)r.key.isEqual(t.key)&&(e=mn(r,t,e,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(t.key)&&(e=mn(r,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const r=mu();return this.mutations.forEach(s=>{const o=t.get(s.key),a=o.overlayedDocument;let l=this.applyToLocalView(a,o.mutatedFields);l=e.has(s.key)?null:l;const h=vu(a,l);h!==null&&r.set(s.key,h),a.isValidDocument()||a.convertToNoDocument(L.min())}),r}keys(){return this.mutations.reduce((t,e)=>t.add(e.key),j())}isEqual(t){return this.batchId===t.batchId&&Ne(this.mutations,t.mutations,(e,r)=>ra(e,r))&&Ne(this.baseMutations,t.baseMutations,(e,r)=>ra(e,r))}}class Ys{constructor(t,e,r,s){this.batch=t,this.commitVersion=e,this.mutationResults=r,this.docVersions=s}static from(t,e,r){W(t.mutations.length===r.length);let s=function(){return ad}();const o=t.mutations;for(let a=0;a<o.length;a++)s=s.insert(o[a].key,r[a].version);return new Ys(t,e,r,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vd{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wd{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var st,$;function Id(n){switch(n){default:return M();case b.CANCELLED:case b.UNKNOWN:case b.DEADLINE_EXCEEDED:case b.RESOURCE_EXHAUSTED:case b.INTERNAL:case b.UNAVAILABLE:case b.UNAUTHENTICATED:return!1;case b.INVALID_ARGUMENT:case b.NOT_FOUND:case b.ALREADY_EXISTS:case b.PERMISSION_DENIED:case b.FAILED_PRECONDITION:case b.ABORTED:case b.OUT_OF_RANGE:case b.UNIMPLEMENTED:case b.DATA_LOSS:return!0}}function Iu(n){if(n===void 0)return Gt("GRPC error has no .code"),b.UNKNOWN;switch(n){case st.OK:return b.OK;case st.CANCELLED:return b.CANCELLED;case st.UNKNOWN:return b.UNKNOWN;case st.DEADLINE_EXCEEDED:return b.DEADLINE_EXCEEDED;case st.RESOURCE_EXHAUSTED:return b.RESOURCE_EXHAUSTED;case st.INTERNAL:return b.INTERNAL;case st.UNAVAILABLE:return b.UNAVAILABLE;case st.UNAUTHENTICATED:return b.UNAUTHENTICATED;case st.INVALID_ARGUMENT:return b.INVALID_ARGUMENT;case st.NOT_FOUND:return b.NOT_FOUND;case st.ALREADY_EXISTS:return b.ALREADY_EXISTS;case st.PERMISSION_DENIED:return b.PERMISSION_DENIED;case st.FAILED_PRECONDITION:return b.FAILED_PRECONDITION;case st.ABORTED:return b.ABORTED;case st.OUT_OF_RANGE:return b.OUT_OF_RANGE;case st.UNIMPLEMENTED:return b.UNIMPLEMENTED;case st.DATA_LOSS:return b.DATA_LOSS;default:return M()}}($=st||(st={}))[$.OK=0]="OK",$[$.CANCELLED=1]="CANCELLED",$[$.UNKNOWN=2]="UNKNOWN",$[$.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",$[$.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",$[$.NOT_FOUND=5]="NOT_FOUND",$[$.ALREADY_EXISTS=6]="ALREADY_EXISTS",$[$.PERMISSION_DENIED=7]="PERMISSION_DENIED",$[$.UNAUTHENTICATED=16]="UNAUTHENTICATED",$[$.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",$[$.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",$[$.ABORTED=10]="ABORTED",$[$.OUT_OF_RANGE=11]="OUT_OF_RANGE",$[$.UNIMPLEMENTED=12]="UNIMPLEMENTED",$[$.INTERNAL=13]="INTERNAL",$[$.UNAVAILABLE=14]="UNAVAILABLE",$[$.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ad(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rd=new de([4294967295,4294967295],0);function oa(n){const t=Ad().encode(n),e=new Ka;return e.update(t),new Uint8Array(e.digest())}function aa(n){const t=new DataView(n.buffer),e=t.getUint32(0,!0),r=t.getUint32(4,!0),s=t.getUint32(8,!0),o=t.getUint32(12,!0);return[new de([e,r],0),new de([s,o],0)]}class Js{constructor(t,e,r){if(this.bitmap=t,this.padding=e,this.hashCount=r,e<0||e>=8)throw new cn(`Invalid padding: ${e}`);if(r<0)throw new cn(`Invalid hash count: ${r}`);if(t.length>0&&this.hashCount===0)throw new cn(`Invalid hash count: ${r}`);if(t.length===0&&e!==0)throw new cn(`Invalid padding when bitmap length is 0: ${e}`);this.Ie=8*t.length-e,this.Te=de.fromNumber(this.Ie)}Ee(t,e,r){let s=t.add(e.multiply(de.fromNumber(r)));return s.compare(Rd)===1&&(s=new de([s.getBits(0),s.getBits(1)],0)),s.modulo(this.Te).toNumber()}de(t){return(this.bitmap[Math.floor(t/8)]&1<<t%8)!=0}mightContain(t){if(this.Ie===0)return!1;const e=oa(t),[r,s]=aa(e);for(let o=0;o<this.hashCount;o++){const a=this.Ee(r,s,o);if(!this.de(a))return!1}return!0}static create(t,e,r){const s=t%8==0?0:8-t%8,o=new Uint8Array(Math.ceil(t/8)),a=new Js(o,s,e);return r.forEach(l=>a.insert(l)),a}insert(t){if(this.Ie===0)return;const e=oa(t),[r,s]=aa(e);for(let o=0;o<this.hashCount;o++){const a=this.Ee(r,s,o);this.Ae(a)}}Ae(t){const e=Math.floor(t/8),r=t%8;this.bitmap[e]|=1<<r}}class cn extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nr{constructor(t,e,r,s,o){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=r,this.documentUpdates=s,this.resolvedLimboDocuments=o}static createSynthesizedRemoteEventForCurrentChange(t,e,r){const s=new Map;return s.set(t,Vn.createSynthesizedTargetChangeForCurrentChange(t,e,r)),new Nr(L.min(),s,new J(K),Ht(),j())}}class Vn{constructor(t,e,r,s,o){this.resumeToken=t,this.current=e,this.addedDocuments=r,this.modifiedDocuments=s,this.removedDocuments=o}static createSynthesizedTargetChangeForCurrentChange(t,e,r){return new Vn(r,e,j(),j(),j())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fr{constructor(t,e,r,s){this.Re=t,this.removedTargetIds=e,this.key=r,this.Ve=s}}class Au{constructor(t,e){this.targetId=t,this.me=e}}class Ru{constructor(t,e,r=dt.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=r,this.cause=s}}class ua{constructor(){this.fe=0,this.ge=ca(),this.pe=dt.EMPTY_BYTE_STRING,this.ye=!1,this.we=!0}get current(){return this.ye}get resumeToken(){return this.pe}get Se(){return this.fe!==0}get be(){return this.we}De(t){t.approximateByteSize()>0&&(this.we=!0,this.pe=t)}ve(){let t=j(),e=j(),r=j();return this.ge.forEach((s,o)=>{switch(o){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:r=r.add(s);break;default:M()}}),new Vn(this.pe,this.ye,t,e,r)}Ce(){this.we=!1,this.ge=ca()}Fe(t,e){this.we=!0,this.ge=this.ge.insert(t,e)}Me(t){this.we=!0,this.ge=this.ge.remove(t)}xe(){this.fe+=1}Oe(){this.fe-=1,W(this.fe>=0)}Ne(){this.we=!0,this.ye=!0}}class Pd{constructor(t){this.Le=t,this.Be=new Map,this.ke=Ht(),this.qe=la(),this.Qe=new J(K)}Ke(t){for(const e of t.Re)t.Ve&&t.Ve.isFoundDocument()?this.$e(e,t.Ve):this.Ue(e,t.key,t.Ve);for(const e of t.removedTargetIds)this.Ue(e,t.key,t.Ve)}We(t){this.forEachTarget(t,e=>{const r=this.Ge(e);switch(t.state){case 0:this.ze(e)&&r.De(t.resumeToken);break;case 1:r.Oe(),r.Se||r.Ce(),r.De(t.resumeToken);break;case 2:r.Oe(),r.Se||this.removeTarget(e);break;case 3:this.ze(e)&&(r.Ne(),r.De(t.resumeToken));break;case 4:this.ze(e)&&(this.je(e),r.De(t.resumeToken));break;default:M()}})}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.Be.forEach((r,s)=>{this.ze(s)&&e(s)})}He(t){const e=t.targetId,r=t.me.count,s=this.Je(e);if(s){const o=s.target;if(Vs(o))if(r===0){const a=new x(o.path);this.Ue(e,a,Et.newNoDocument(a,L.min()))}else W(r===1);else{const a=this.Ye(e);if(a!==r){const l=this.Ze(t),h=l?this.Xe(l,t,a):1;if(h!==0){this.je(e);const f=h===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Qe=this.Qe.insert(e,f)}}}}}Ze(t){const e=t.me.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:r="",padding:s=0},hashCount:o=0}=e;let a,l;try{a=me(r).toUint8Array()}catch(h){if(h instanceof nu)return ke("Decoding the base64 bloom filter in existence filter failed ("+h.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw h}try{l=new Js(a,s,o)}catch(h){return ke(h instanceof cn?"BloomFilter error: ":"Applying bloom filter failed: ",h),null}return l.Ie===0?null:l}Xe(t,e,r){return e.me.count===r-this.nt(t,e.targetId)?0:2}nt(t,e){const r=this.Le.getRemoteKeysForTarget(e);let s=0;return r.forEach(o=>{const a=this.Le.tt(),l=`projects/${a.projectId}/databases/${a.database}/documents/${o.path.canonicalString()}`;t.mightContain(l)||(this.Ue(e,o,null),s++)}),s}rt(t){const e=new Map;this.Be.forEach((o,a)=>{const l=this.Je(a);if(l){if(o.current&&Vs(l.target)){const h=new x(l.target.path);this.ke.get(h)!==null||this.it(a,h)||this.Ue(a,h,Et.newNoDocument(h,t))}o.be&&(e.set(a,o.ve()),o.Ce())}});let r=j();this.qe.forEach((o,a)=>{let l=!0;a.forEachWhile(h=>{const f=this.Je(h);return!f||f.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(r=r.add(o))}),this.ke.forEach((o,a)=>a.setReadTime(t));const s=new Nr(t,e,this.Qe,this.ke,r);return this.ke=Ht(),this.qe=la(),this.Qe=new J(K),s}$e(t,e){if(!this.ze(t))return;const r=this.it(t,e.key)?2:0;this.Ge(t).Fe(e.key,r),this.ke=this.ke.insert(e.key,e),this.qe=this.qe.insert(e.key,this.st(e.key).add(t))}Ue(t,e,r){if(!this.ze(t))return;const s=this.Ge(t);this.it(t,e)?s.Fe(e,1):s.Me(e),this.qe=this.qe.insert(e,this.st(e).delete(t)),r&&(this.ke=this.ke.insert(e,r))}removeTarget(t){this.Be.delete(t)}Ye(t){const e=this.Ge(t).ve();return this.Le.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}xe(t){this.Ge(t).xe()}Ge(t){let e=this.Be.get(t);return e||(e=new ua,this.Be.set(t,e)),e}st(t){let e=this.qe.get(t);return e||(e=new ht(K),this.qe=this.qe.insert(t,e)),e}ze(t){const e=this.Je(t)!==null;return e||O("WatchChangeAggregator","Detected inactive target",t),e}Je(t){const e=this.Be.get(t);return e&&e.Se?null:this.Le.ot(t)}je(t){this.Be.set(t,new ua),this.Le.getRemoteKeysForTarget(t).forEach(e=>{this.Ue(t,e,null)})}it(t,e){return this.Le.getRemoteKeysForTarget(t).has(e)}}function la(){return new J(x.comparator)}function ca(){return new J(x.comparator)}const bd={asc:"ASCENDING",desc:"DESCENDING"},Cd={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Sd={and:"AND",or:"OR"};class Vd{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function ks(n,t){return n.useProto3Json||Pr(t)?t:{value:t}}function Tr(n,t){return n.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function Pu(n,t){return n.useProto3Json?t.toBase64():t.toUint8Array()}function Dd(n,t){return Tr(n,t.toTimestamp())}function Mt(n){return W(!!n),L.fromTimestamp(function(e){const r=ne(e);return new ot(r.seconds,r.nanos)}(n))}function Zs(n,t){return Ns(n,t).canonicalString()}function Ns(n,t){const e=function(s){return new X(["projects",s.projectId,"databases",s.database])}(n).child("documents");return t===void 0?e:e.child(t)}function bu(n){const t=X.fromString(n);return W(ku(t)),t}function Os(n,t){return Zs(n.databaseId,t.path)}function ps(n,t){const e=bu(t);if(e.get(1)!==n.databaseId.projectId)throw new k(b.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+n.databaseId.projectId);if(e.get(3)!==n.databaseId.database)throw new k(b.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+n.databaseId.database);return new x(Su(e))}function Cu(n,t){return Zs(n.databaseId,t)}function kd(n){const t=bu(n);return t.length===4?X.emptyPath():Su(t)}function xs(n){return new X(["projects",n.databaseId.projectId,"databases",n.databaseId.database]).canonicalString()}function Su(n){return W(n.length>4&&n.get(4)==="documents"),n.popFirst(5)}function ha(n,t,e){return{name:Os(n,t),fields:e.value.mapValue.fields}}function Nd(n,t){let e;if("targetChange"in t){t.targetChange;const r=function(f){return f==="NO_CHANGE"?0:f==="ADD"?1:f==="REMOVE"?2:f==="CURRENT"?3:f==="RESET"?4:M()}(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],o=function(f,p){return f.useProto3Json?(W(p===void 0||typeof p=="string"),dt.fromBase64String(p||"")):(W(p===void 0||p instanceof Buffer||p instanceof Uint8Array),dt.fromUint8Array(p||new Uint8Array))}(n,t.targetChange.resumeToken),a=t.targetChange.cause,l=a&&function(f){const p=f.code===void 0?b.UNKNOWN:Iu(f.code);return new k(p,f.message||"")}(a);e=new Ru(r,s,o,l||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const s=ps(n,r.document.name),o=Mt(r.document.updateTime),a=r.document.createTime?Mt(r.document.createTime):L.min(),l=new Ct({mapValue:{fields:r.document.fields}}),h=Et.newFoundDocument(s,o,a,l),f=r.targetIds||[],p=r.removedTargetIds||[];e=new fr(f,p,h.key,h)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const s=ps(n,r.document),o=r.readTime?Mt(r.readTime):L.min(),a=Et.newNoDocument(s,o),l=r.removedTargetIds||[];e=new fr([],l,a.key,a)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const s=ps(n,r.document),o=r.removedTargetIds||[];e=new fr([],o,s,null)}else{if(!("filter"in t))return M();{t.filter;const r=t.filter;r.targetId;const{count:s=0,unchangedNames:o}=r,a=new wd(s,o),l=r.targetId;e=new Au(l,a)}}return e}function Od(n,t){let e;if(t instanceof Sn)e={update:ha(n,t.key,t.value)};else if(t instanceof kr)e={delete:Os(n,t.key)};else if(t instanceof se)e={update:ha(n,t.key,t.data),updateMask:$d(t.fieldMask)};else{if(!(t instanceof Ed))return M();e={verify:Os(n,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map(r=>function(o,a){const l=a.transform;if(l instanceof An)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(l instanceof Rn)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:l.elements}};if(l instanceof Pn)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:l.elements}};if(l instanceof Er)return{fieldPath:a.field.canonicalString(),increment:l.Pe};throw M()}(0,r))),t.precondition.isNone||(e.currentDocument=function(s,o){return o.updateTime!==void 0?{updateTime:Dd(s,o.updateTime)}:o.exists!==void 0?{exists:o.exists}:M()}(n,t.precondition)),e}function xd(n,t){return n&&n.length>0?(W(t!==void 0),n.map(e=>function(s,o){let a=s.updateTime?Mt(s.updateTime):Mt(o);return a.isEqual(L.min())&&(a=Mt(o)),new gd(a,s.transformResults||[])}(e,t))):[]}function Md(n,t){return{documents:[Cu(n,t.path)]}}function Ld(n,t){const e={structuredQuery:{}},r=t.path;let s;t.collectionGroup!==null?(s=r,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=r.popLast(),e.structuredQuery.from=[{collectionId:r.lastSegment()}]),e.parent=Cu(n,s);const o=function(f){if(f.length!==0)return Du(Nt.create(f,"and"))}(t.filters);o&&(e.structuredQuery.where=o);const a=function(f){if(f.length!==0)return f.map(p=>function(I){return{field:be(I.field),direction:Bd(I.dir)}}(p))}(t.orderBy);a&&(e.structuredQuery.orderBy=a);const l=ks(n,t.limit);return l!==null&&(e.structuredQuery.limit=l),t.startAt&&(e.structuredQuery.startAt=function(f){return{before:f.inclusive,values:f.position}}(t.startAt)),t.endAt&&(e.structuredQuery.endAt=function(f){return{before:!f.inclusive,values:f.position}}(t.endAt)),{_t:e,parent:s}}function Fd(n){let t=kd(n.parent);const e=n.structuredQuery,r=e.from?e.from.length:0;let s=null;if(r>0){W(r===1);const p=e.from[0];p.allDescendants?s=p.collectionId:t=t.child(p.collectionId)}let o=[];e.where&&(o=function(E){const I=Vu(E);return I instanceof Nt&&ou(I)?I.getFilters():[I]}(e.where));let a=[];e.orderBy&&(a=function(E){return E.map(I=>function(V){return new In(Ce(V.field),function(S){switch(S){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(V.direction))}(I))}(e.orderBy));let l=null;e.limit&&(l=function(E){let I;return I=typeof E=="object"?E.value:E,Pr(I)?null:I}(e.limit));let h=null;e.startAt&&(h=function(E){const I=!!E.before,P=E.values||[];return new _r(P,I)}(e.startAt));let f=null;return e.endAt&&(f=function(E){const I=!E.before,P=E.values||[];return new _r(P,I)}(e.endAt)),nd(t,s,a,o,l,"F",h,f)}function Ud(n,t){const e=function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return M()}}(t.purpose);return e==null?null:{"goog-listen-tags":e}}function Vu(n){return n.unaryFilter!==void 0?function(e){switch(e.unaryFilter.op){case"IS_NAN":const r=Ce(e.unaryFilter.field);return it.create(r,"==",{doubleValue:NaN});case"IS_NULL":const s=Ce(e.unaryFilter.field);return it.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const o=Ce(e.unaryFilter.field);return it.create(o,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=Ce(e.unaryFilter.field);return it.create(a,"!=",{nullValue:"NULL_VALUE"});default:return M()}}(n):n.fieldFilter!==void 0?function(e){return it.create(Ce(e.fieldFilter.field),function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";default:return M()}}(e.fieldFilter.op),e.fieldFilter.value)}(n):n.compositeFilter!==void 0?function(e){return Nt.create(e.compositeFilter.filters.map(r=>Vu(r)),function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return M()}}(e.compositeFilter.op))}(n):M()}function Bd(n){return bd[n]}function qd(n){return Cd[n]}function jd(n){return Sd[n]}function be(n){return{fieldPath:n.canonicalString()}}function Ce(n){return ct.fromServerFormat(n.fieldPath)}function Du(n){return n instanceof it?function(e){if(e.op==="=="){if(Yo(e.value))return{unaryFilter:{field:be(e.field),op:"IS_NAN"}};if(Xo(e.value))return{unaryFilter:{field:be(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Yo(e.value))return{unaryFilter:{field:be(e.field),op:"IS_NOT_NAN"}};if(Xo(e.value))return{unaryFilter:{field:be(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:be(e.field),op:qd(e.op),value:e.value}}}(n):n instanceof Nt?function(e){const r=e.getFilters().map(s=>Du(s));return r.length===1?r[0]:{compositeFilter:{op:jd(e.op),filters:r}}}(n):M()}function $d(n){const t=[];return n.fields.forEach(e=>t.push(e.canonicalString())),{fieldPaths:t}}function ku(n){return n.length>=4&&n.get(0)==="projects"&&n.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jt{constructor(t,e,r,s,o=L.min(),a=L.min(),l=dt.EMPTY_BYTE_STRING,h=null){this.target=t,this.targetId=e,this.purpose=r,this.sequenceNumber=s,this.snapshotVersion=o,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=l,this.expectedCount=h}withSequenceNumber(t){return new Jt(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new Jt(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new Jt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new Jt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zd{constructor(t){this.ct=t}}function Gd(n){const t=Fd({parent:n.parent,structuredQuery:n.structuredQuery});return n.limitType==="LAST"?yr(t,t.limit,"L"):t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hd{constructor(){this.un=new Kd}addToCollectionParentIndex(t,e){return this.un.add(e),C.resolve()}getCollectionParents(t,e){return C.resolve(this.un.getEntries(e))}addFieldIndex(t,e){return C.resolve()}deleteFieldIndex(t,e){return C.resolve()}deleteAllFieldIndexes(t){return C.resolve()}createTargetIndexes(t,e){return C.resolve()}getDocumentsMatchingTarget(t,e){return C.resolve(null)}getIndexType(t,e){return C.resolve(0)}getFieldIndexes(t,e){return C.resolve([])}getNextCollectionGroupToUpdate(t){return C.resolve(null)}getMinOffset(t,e){return C.resolve(ee.min())}getMinOffsetFromCollectionGroup(t,e){return C.resolve(ee.min())}updateCollectionGroup(t,e,r){return C.resolve()}updateIndexEntries(t,e){return C.resolve()}}class Kd{constructor(){this.index={}}add(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e]||new ht(X.comparator),o=!s.has(r);return this.index[e]=s.add(r),o}has(t){const e=t.lastSegment(),r=t.popLast(),s=this.index[e];return s&&s.has(r)}getEntries(t){return(this.index[t]||new ht(X.comparator)).toArray()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{constructor(t){this.Ln=t}next(){return this.Ln+=2,this.Ln}static Bn(){return new Me(0)}static kn(){return new Me(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wd{constructor(){this.changes=new Be(t=>t.toString(),(t,e)=>t.isEqual(e)),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,Et.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const r=this.changes.get(e);return r!==void 0?C.resolve(r):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qd{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xd{constructor(t,e,r,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=r,this.indexManager=s}getDocument(t,e){let r=null;return this.documentOverlayCache.getOverlay(t,e).next(s=>(r=s,this.remoteDocumentCache.getEntry(t,e))).next(s=>(r!==null&&mn(r.mutation,s,Vt.empty(),ot.now()),s))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.getLocalViewOfDocuments(t,r,j()).next(()=>r))}getLocalViewOfDocuments(t,e,r=j()){const s=ce();return this.populateOverlays(t,s,e).next(()=>this.computeViews(t,e,s,r).next(o=>{let a=ln();return o.forEach((l,h)=>{a=a.insert(l,h.overlayedDocument)}),a}))}getOverlayedDocuments(t,e){const r=ce();return this.populateOverlays(t,r,e).next(()=>this.computeViews(t,e,r,j()))}populateOverlays(t,e,r){const s=[];return r.forEach(o=>{e.has(o)||s.push(o)}),this.documentOverlayCache.getOverlays(t,s).next(o=>{o.forEach((a,l)=>{e.set(a,l)})})}computeViews(t,e,r,s){let o=Ht();const a=pn(),l=function(){return pn()}();return e.forEach((h,f)=>{const p=r.get(f.key);s.has(f.key)&&(p===void 0||p.mutation instanceof se)?o=o.insert(f.key,f):p!==void 0?(a.set(f.key,p.mutation.getFieldMask()),mn(p.mutation,f,p.mutation.getFieldMask(),ot.now())):a.set(f.key,Vt.empty())}),this.recalculateAndSaveOverlays(t,o).next(h=>(h.forEach((f,p)=>a.set(f,p)),e.forEach((f,p)=>{var E;return l.set(f,new Qd(p,(E=a.get(f))!==null&&E!==void 0?E:null))}),l))}recalculateAndSaveOverlays(t,e){const r=pn();let s=new J((a,l)=>a-l),o=j();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next(a=>{for(const l of a)l.keys().forEach(h=>{const f=e.get(h);if(f===null)return;let p=r.get(h)||Vt.empty();p=l.applyToLocalView(f,p),r.set(h,p);const E=(s.get(l.batchId)||j()).add(h);s=s.insert(l.batchId,E)})}).next(()=>{const a=[],l=s.getReverseIterator();for(;l.hasNext();){const h=l.getNext(),f=h.key,p=h.value,E=mu();p.forEach(I=>{if(!o.has(I)){const P=vu(e.get(I),r.get(I));P!==null&&E.set(I,P),o=o.add(I)}}),a.push(this.documentOverlayCache.saveOverlays(t,f,E))}return C.waitFor(a)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next(r=>this.recalculateAndSaveOverlays(t,r))}getDocumentsMatchingQuery(t,e,r,s){return function(a){return x.isDocumentKey(a.path)&&a.collectionGroup===null&&a.filters.length===0}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):cu(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,r,s):this.getDocumentsMatchingCollectionQuery(t,e,r,s)}getNextDocuments(t,e,r,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,r,s).next(o=>{const a=s-o.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,r.largestBatchId,s-o.size):C.resolve(ce());let l=-1,h=o;return a.next(f=>C.forEach(f,(p,E)=>(l<E.largestBatchId&&(l=E.largestBatchId),o.get(p)?C.resolve():this.remoteDocumentCache.getEntry(t,p).next(I=>{h=h.insert(p,I)}))).next(()=>this.populateOverlays(t,f,o)).next(()=>this.computeViews(t,h,f,j())).next(p=>({batchId:l,changes:pu(p)})))})}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new x(e)).next(r=>{let s=ln();return r.isFoundDocument()&&(s=s.insert(r.key,r)),s})}getDocumentsMatchingCollectionGroupQuery(t,e,r,s){const o=e.collectionGroup;let a=ln();return this.indexManager.getCollectionParents(t,o).next(l=>C.forEach(l,h=>{const f=function(E,I){return new Te(I,null,E.explicitOrderBy.slice(),E.filters.slice(),E.limit,E.limitType,E.startAt,E.endAt)}(e,h.child(o));return this.getDocumentsMatchingCollectionQuery(t,f,r,s).next(p=>{p.forEach((E,I)=>{a=a.insert(E,I)})})}).next(()=>a))}getDocumentsMatchingCollectionQuery(t,e,r,s){let o;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,r.largestBatchId).next(a=>(o=a,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,r,o,s))).next(a=>{o.forEach((h,f)=>{const p=f.getKey();a.get(p)===null&&(a=a.insert(p,Et.newInvalidDocument(p)))});let l=ln();return a.forEach((h,f)=>{const p=o.get(h);p!==void 0&&mn(p.mutation,f,Vt.empty(),ot.now()),Sr(e,f)&&(l=l.insert(h,f))}),l})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yd{constructor(t){this.serializer=t,this.hr=new Map,this.Pr=new Map}getBundleMetadata(t,e){return C.resolve(this.hr.get(e))}saveBundleMetadata(t,e){return this.hr.set(e.id,function(s){return{id:s.id,version:s.version,createTime:Mt(s.createTime)}}(e)),C.resolve()}getNamedQuery(t,e){return C.resolve(this.Pr.get(e))}saveNamedQuery(t,e){return this.Pr.set(e.name,function(s){return{name:s.name,query:Gd(s.bundledQuery),readTime:Mt(s.readTime)}}(e)),C.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jd{constructor(){this.overlays=new J(x.comparator),this.Ir=new Map}getOverlay(t,e){return C.resolve(this.overlays.get(e))}getOverlays(t,e){const r=ce();return C.forEach(e,s=>this.getOverlay(t,s).next(o=>{o!==null&&r.set(s,o)})).next(()=>r)}saveOverlays(t,e,r){return r.forEach((s,o)=>{this.ht(t,e,o)}),C.resolve()}removeOverlaysForBatchId(t,e,r){const s=this.Ir.get(r);return s!==void 0&&(s.forEach(o=>this.overlays=this.overlays.remove(o)),this.Ir.delete(r)),C.resolve()}getOverlaysForCollection(t,e,r){const s=ce(),o=e.length+1,a=new x(e.child("")),l=this.overlays.getIteratorFrom(a);for(;l.hasNext();){const h=l.getNext().value,f=h.getKey();if(!e.isPrefixOf(f.path))break;f.path.length===o&&h.largestBatchId>r&&s.set(h.getKey(),h)}return C.resolve(s)}getOverlaysForCollectionGroup(t,e,r,s){let o=new J((f,p)=>f-p);const a=this.overlays.getIterator();for(;a.hasNext();){const f=a.getNext().value;if(f.getKey().getCollectionGroup()===e&&f.largestBatchId>r){let p=o.get(f.largestBatchId);p===null&&(p=ce(),o=o.insert(f.largestBatchId,p)),p.set(f.getKey(),f)}}const l=ce(),h=o.getIterator();for(;h.hasNext()&&(h.getNext().value.forEach((f,p)=>l.set(f,p)),!(l.size()>=s)););return C.resolve(l)}ht(t,e,r){const s=this.overlays.get(r.key);if(s!==null){const a=this.Ir.get(s.largestBatchId).delete(r.key);this.Ir.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(r.key,new vd(e,r));let o=this.Ir.get(e);o===void 0&&(o=j(),this.Ir.set(e,o)),this.Ir.set(e,o.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zd{constructor(){this.sessionToken=dt.EMPTY_BYTE_STRING}getSessionToken(t){return C.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,C.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ti{constructor(){this.Tr=new ht(at.Er),this.dr=new ht(at.Ar)}isEmpty(){return this.Tr.isEmpty()}addReference(t,e){const r=new at(t,e);this.Tr=this.Tr.add(r),this.dr=this.dr.add(r)}Rr(t,e){t.forEach(r=>this.addReference(r,e))}removeReference(t,e){this.Vr(new at(t,e))}mr(t,e){t.forEach(r=>this.removeReference(r,e))}gr(t){const e=new x(new X([])),r=new at(e,t),s=new at(e,t+1),o=[];return this.dr.forEachInRange([r,s],a=>{this.Vr(a),o.push(a.key)}),o}pr(){this.Tr.forEach(t=>this.Vr(t))}Vr(t){this.Tr=this.Tr.delete(t),this.dr=this.dr.delete(t)}yr(t){const e=new x(new X([])),r=new at(e,t),s=new at(e,t+1);let o=j();return this.dr.forEachInRange([r,s],a=>{o=o.add(a.key)}),o}containsKey(t){const e=new at(t,0),r=this.Tr.firstAfterOrEqual(e);return r!==null&&t.isEqual(r.key)}}class at{constructor(t,e){this.key=t,this.wr=e}static Er(t,e){return x.comparator(t.key,e.key)||K(t.wr,e.wr)}static Ar(t,e){return K(t.wr,e.wr)||x.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tf{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.Sr=1,this.br=new ht(at.Er)}checkEmpty(t){return C.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,r,s){const o=this.Sr;this.Sr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new Td(o,e,r,s);this.mutationQueue.push(a);for(const l of s)this.br=this.br.add(new at(l.key,o)),this.indexManager.addToCollectionParentIndex(t,l.key.path.popLast());return C.resolve(a)}lookupMutationBatch(t,e){return C.resolve(this.Dr(e))}getNextMutationBatchAfterBatchId(t,e){const r=e+1,s=this.vr(r),o=s<0?0:s;return C.resolve(this.mutationQueue.length>o?this.mutationQueue[o]:null)}getHighestUnacknowledgedBatchId(){return C.resolve(this.mutationQueue.length===0?-1:this.Sr-1)}getAllMutationBatches(t){return C.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const r=new at(e,0),s=new at(e,Number.POSITIVE_INFINITY),o=[];return this.br.forEachInRange([r,s],a=>{const l=this.Dr(a.wr);o.push(l)}),C.resolve(o)}getAllMutationBatchesAffectingDocumentKeys(t,e){let r=new ht(K);return e.forEach(s=>{const o=new at(s,0),a=new at(s,Number.POSITIVE_INFINITY);this.br.forEachInRange([o,a],l=>{r=r.add(l.wr)})}),C.resolve(this.Cr(r))}getAllMutationBatchesAffectingQuery(t,e){const r=e.path,s=r.length+1;let o=r;x.isDocumentKey(o)||(o=o.child(""));const a=new at(new x(o),0);let l=new ht(K);return this.br.forEachWhile(h=>{const f=h.key.path;return!!r.isPrefixOf(f)&&(f.length===s&&(l=l.add(h.wr)),!0)},a),C.resolve(this.Cr(l))}Cr(t){const e=[];return t.forEach(r=>{const s=this.Dr(r);s!==null&&e.push(s)}),e}removeMutationBatch(t,e){W(this.Fr(e.batchId,"removed")===0),this.mutationQueue.shift();let r=this.br;return C.forEach(e.mutations,s=>{const o=new at(s.key,e.batchId);return r=r.delete(o),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)}).next(()=>{this.br=r})}On(t){}containsKey(t,e){const r=new at(e,0),s=this.br.firstAfterOrEqual(r);return C.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,C.resolve()}Fr(t,e){return this.vr(t)}vr(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Dr(t){const e=this.vr(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ef{constructor(t){this.Mr=t,this.docs=function(){return new J(x.comparator)}(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const r=e.key,s=this.docs.get(r),o=s?s.size:0,a=this.Mr(e);return this.docs=this.docs.insert(r,{document:e.mutableCopy(),size:a}),this.size+=a-o,this.indexManager.addToCollectionParentIndex(t,r.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const r=this.docs.get(e);return C.resolve(r?r.document.mutableCopy():Et.newInvalidDocument(e))}getEntries(t,e){let r=Ht();return e.forEach(s=>{const o=this.docs.get(s);r=r.insert(s,o?o.document.mutableCopy():Et.newInvalidDocument(s))}),C.resolve(r)}getDocumentsMatchingQuery(t,e,r,s){let o=Ht();const a=e.path,l=new x(a.child("")),h=this.docs.getIteratorFrom(l);for(;h.hasNext();){const{key:f,value:{document:p}}=h.getNext();if(!a.isPrefixOf(f.path))break;f.path.length>a.length+1||Lh(Mh(p),r)<=0||(s.has(p.key)||Sr(e,p))&&(o=o.insert(p.key,p.mutableCopy()))}return C.resolve(o)}getAllFromCollectionGroup(t,e,r,s){M()}Or(t,e){return C.forEach(this.docs,r=>e(r))}newChangeBuffer(t){return new nf(this)}getSize(t){return C.resolve(this.size)}}class nf extends Wd{constructor(t){super(),this.cr=t}applyChanges(t){const e=[];return this.changes.forEach((r,s)=>{s.isValidDocument()?e.push(this.cr.addEntry(t,s)):this.cr.removeEntry(r)}),C.waitFor(e)}getFromCache(t,e){return this.cr.getEntry(t,e)}getAllFromCache(t,e){return this.cr.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rf{constructor(t){this.persistence=t,this.Nr=new Be(e=>Ws(e),Qs),this.lastRemoteSnapshotVersion=L.min(),this.highestTargetId=0,this.Lr=0,this.Br=new ti,this.targetCount=0,this.kr=Me.Bn()}forEachTarget(t,e){return this.Nr.forEach((r,s)=>e(s)),C.resolve()}getLastRemoteSnapshotVersion(t){return C.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return C.resolve(this.Lr)}allocateTargetId(t){return this.highestTargetId=this.kr.next(),C.resolve(this.highestTargetId)}setTargetsMetadata(t,e,r){return r&&(this.lastRemoteSnapshotVersion=r),e>this.Lr&&(this.Lr=e),C.resolve()}Kn(t){this.Nr.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.kr=new Me(e),this.highestTargetId=e),t.sequenceNumber>this.Lr&&(this.Lr=t.sequenceNumber)}addTargetData(t,e){return this.Kn(e),this.targetCount+=1,C.resolve()}updateTargetData(t,e){return this.Kn(e),C.resolve()}removeTargetData(t,e){return this.Nr.delete(e.target),this.Br.gr(e.targetId),this.targetCount-=1,C.resolve()}removeTargets(t,e,r){let s=0;const o=[];return this.Nr.forEach((a,l)=>{l.sequenceNumber<=e&&r.get(l.targetId)===null&&(this.Nr.delete(a),o.push(this.removeMatchingKeysForTargetId(t,l.targetId)),s++)}),C.waitFor(o).next(()=>s)}getTargetCount(t){return C.resolve(this.targetCount)}getTargetData(t,e){const r=this.Nr.get(e)||null;return C.resolve(r)}addMatchingKeys(t,e,r){return this.Br.Rr(e,r),C.resolve()}removeMatchingKeys(t,e,r){this.Br.mr(e,r);const s=this.persistence.referenceDelegate,o=[];return s&&e.forEach(a=>{o.push(s.markPotentiallyOrphaned(t,a))}),C.waitFor(o)}removeMatchingKeysForTargetId(t,e){return this.Br.gr(e),C.resolve()}getMatchingKeysForTargetId(t,e){const r=this.Br.yr(e);return C.resolve(r)}containsKey(t,e){return C.resolve(this.Br.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sf{constructor(t,e){this.qr={},this.overlays={},this.Qr=new zs(0),this.Kr=!1,this.Kr=!0,this.$r=new Zd,this.referenceDelegate=t(this),this.Ur=new rf(this),this.indexManager=new Hd,this.remoteDocumentCache=function(s){return new ef(s)}(r=>this.referenceDelegate.Wr(r)),this.serializer=new zd(e),this.Gr=new Yd(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.Kr=!1,Promise.resolve()}get started(){return this.Kr}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Jd,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let r=this.qr[t.toKey()];return r||(r=new tf(e,this.referenceDelegate),this.qr[t.toKey()]=r),r}getGlobalsCache(){return this.$r}getTargetCache(){return this.Ur}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Gr}runTransaction(t,e,r){O("MemoryPersistence","Starting transaction:",t);const s=new of(this.Qr.next());return this.referenceDelegate.zr(),r(s).next(o=>this.referenceDelegate.jr(s).next(()=>o)).toPromise().then(o=>(s.raiseOnCommittedEvent(),o))}Hr(t,e){return C.or(Object.values(this.qr).map(r=>()=>r.containsKey(t,e)))}}class of extends Uh{constructor(t){super(),this.currentSequenceNumber=t}}class ei{constructor(t){this.persistence=t,this.Jr=new ti,this.Yr=null}static Zr(t){return new ei(t)}get Xr(){if(this.Yr)return this.Yr;throw M()}addReference(t,e,r){return this.Jr.addReference(r,e),this.Xr.delete(r.toString()),C.resolve()}removeReference(t,e,r){return this.Jr.removeReference(r,e),this.Xr.add(r.toString()),C.resolve()}markPotentiallyOrphaned(t,e){return this.Xr.add(e.toString()),C.resolve()}removeTarget(t,e){this.Jr.gr(e.targetId).forEach(s=>this.Xr.add(s.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(t,e.targetId).next(s=>{s.forEach(o=>this.Xr.add(o.toString()))}).next(()=>r.removeTargetData(t,e))}zr(){this.Yr=new Set}jr(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return C.forEach(this.Xr,r=>{const s=x.fromPath(r);return this.ei(t,s).next(o=>{o||e.removeEntry(s,L.min())})}).next(()=>(this.Yr=null,e.apply(t)))}updateLimboDocument(t,e){return this.ei(t,e).next(r=>{r?this.Xr.delete(e.toString()):this.Xr.add(e.toString())})}Wr(t){return 0}ei(t,e){return C.or([()=>C.resolve(this.Jr.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Hr(t,e)])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(t,e,r,s){this.targetId=t,this.fromCache=e,this.$i=r,this.Ui=s}static Wi(t,e){let r=j(),s=j();for(const o of e.docChanges)switch(o.type){case 0:r=r.add(o.doc.key);break;case 1:s=s.add(o.doc.key)}return new ni(t,e.fromCache,r,s)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class af{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uf{constructor(){this.Gi=!1,this.zi=!1,this.ji=100,this.Hi=function(){return wc()?8:Bh(js())>0?6:4}()}initialize(t,e){this.Ji=t,this.indexManager=e,this.Gi=!0}getDocumentsMatchingQuery(t,e,r,s){const o={result:null};return this.Yi(t,e).next(a=>{o.result=a}).next(()=>{if(!o.result)return this.Zi(t,e,s,r).next(a=>{o.result=a})}).next(()=>{if(o.result)return;const a=new af;return this.Xi(t,e,a).next(l=>{if(o.result=l,this.zi)return this.es(t,e,a,l.size)})}).next(()=>o.result)}es(t,e,r,s){return r.documentReadCount<this.ji?(on()<=G.DEBUG&&O("QueryEngine","SDK will not create cache indexes for query:",Pe(e),"since it only creates cache indexes for collection contains","more than or equal to",this.ji,"documents"),C.resolve()):(on()<=G.DEBUG&&O("QueryEngine","Query:",Pe(e),"scans",r.documentReadCount,"local documents and returns",s,"documents as results."),r.documentReadCount>this.Hi*s?(on()<=G.DEBUG&&O("QueryEngine","The SDK decides to create cache indexes for query:",Pe(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,xt(e))):C.resolve())}Yi(t,e){if(ea(e))return C.resolve(null);let r=xt(e);return this.indexManager.getIndexType(t,r).next(s=>s===0?null:(e.limit!==null&&s===1&&(e=yr(e,null,"F"),r=xt(e)),this.indexManager.getDocumentsMatchingTarget(t,r).next(o=>{const a=j(...o);return this.Ji.getDocuments(t,a).next(l=>this.indexManager.getMinOffset(t,r).next(h=>{const f=this.ts(e,l);return this.ns(e,f,a,h.readTime)?this.Yi(t,yr(e,null,"F")):this.rs(t,f,e,h)}))})))}Zi(t,e,r,s){return ea(e)||s.isEqual(L.min())?C.resolve(null):this.Ji.getDocuments(t,r).next(o=>{const a=this.ts(e,o);return this.ns(e,a,r,s)?C.resolve(null):(on()<=G.DEBUG&&O("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Pe(e)),this.rs(t,a,e,xh(s,-1)).next(l=>l))})}ts(t,e){let r=new ht(du(t));return e.forEach((s,o)=>{Sr(t,o)&&(r=r.add(o))}),r}ns(t,e,r,s){if(t.limit===null)return!1;if(r.size!==e.size)return!0;const o=t.limitType==="F"?e.last():e.first();return!!o&&(o.hasPendingWrites||o.version.compareTo(s)>0)}Xi(t,e,r){return on()<=G.DEBUG&&O("QueryEngine","Using full collection scan to execute query:",Pe(e)),this.Ji.getDocumentsMatchingQuery(t,e,ee.min(),r)}rs(t,e,r,s){return this.Ji.getDocumentsMatchingQuery(t,r,s).next(o=>(e.forEach(a=>{o=o.insert(a.key,a)}),o))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lf{constructor(t,e,r,s){this.persistence=t,this.ss=e,this.serializer=s,this.os=new J(K),this._s=new Be(o=>Ws(o),Qs),this.us=new Map,this.cs=t.getRemoteDocumentCache(),this.Ur=t.getTargetCache(),this.Gr=t.getBundleCache(),this.ls(r)}ls(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Xd(this.cs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.cs.setIndexManager(this.indexManager),this.ss.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",e=>t.collect(e,this.os))}}function cf(n,t,e,r){return new lf(n,t,e,r)}async function Nu(n,t){const e=F(n);return await e.persistence.runTransaction("Handle user change","readonly",r=>{let s;return e.mutationQueue.getAllMutationBatches(r).next(o=>(s=o,e.ls(t),e.mutationQueue.getAllMutationBatches(r))).next(o=>{const a=[],l=[];let h=j();for(const f of s){a.push(f.batchId);for(const p of f.mutations)h=h.add(p.key)}for(const f of o){l.push(f.batchId);for(const p of f.mutations)h=h.add(p.key)}return e.localDocuments.getDocuments(r,h).next(f=>({hs:f,removedBatchIds:a,addedBatchIds:l}))})})}function hf(n,t){const e=F(n);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const s=t.batch.keys(),o=e.cs.newChangeBuffer({trackRemovals:!0});return function(l,h,f,p){const E=f.batch,I=E.keys();let P=C.resolve();return I.forEach(V=>{P=P.next(()=>p.getEntry(h,V)).next(N=>{const S=f.docVersions.get(V);W(S!==null),N.version.compareTo(S)<0&&(E.applyToRemoteDocument(N,f),N.isValidDocument()&&(N.setReadTime(f.commitVersion),p.addEntry(N)))})}),P.next(()=>l.mutationQueue.removeMutationBatch(h,E))}(e,r,t,o).next(()=>o.apply(r)).next(()=>e.mutationQueue.performConsistencyCheck(r)).next(()=>e.documentOverlayCache.removeOverlaysForBatchId(r,s,t.batch.batchId)).next(()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(l){let h=j();for(let f=0;f<l.mutationResults.length;++f)l.mutationResults[f].transformResults.length>0&&(h=h.add(l.batch.mutations[f].key));return h}(t))).next(()=>e.localDocuments.getDocuments(r,s))})}function Ou(n){const t=F(n);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Ur.getLastRemoteSnapshotVersion(e))}function df(n,t){const e=F(n),r=t.snapshotVersion;let s=e.os;return e.persistence.runTransaction("Apply remote event","readwrite-primary",o=>{const a=e.cs.newChangeBuffer({trackRemovals:!0});s=e.os;const l=[];t.targetChanges.forEach((p,E)=>{const I=s.get(E);if(!I)return;l.push(e.Ur.removeMatchingKeys(o,p.removedDocuments,E).next(()=>e.Ur.addMatchingKeys(o,p.addedDocuments,E)));let P=I.withSequenceNumber(o.currentSequenceNumber);t.targetMismatches.get(E)!==null?P=P.withResumeToken(dt.EMPTY_BYTE_STRING,L.min()).withLastLimboFreeSnapshotVersion(L.min()):p.resumeToken.approximateByteSize()>0&&(P=P.withResumeToken(p.resumeToken,r)),s=s.insert(E,P),function(N,S,U){return N.resumeToken.approximateByteSize()===0||S.snapshotVersion.toMicroseconds()-N.snapshotVersion.toMicroseconds()>=3e8?!0:U.addedDocuments.size+U.modifiedDocuments.size+U.removedDocuments.size>0}(I,P,p)&&l.push(e.Ur.updateTargetData(o,P))});let h=Ht(),f=j();if(t.documentUpdates.forEach(p=>{t.resolvedLimboDocuments.has(p)&&l.push(e.persistence.referenceDelegate.updateLimboDocument(o,p))}),l.push(ff(o,a,t.documentUpdates).next(p=>{h=p.Ps,f=p.Is})),!r.isEqual(L.min())){const p=e.Ur.getLastRemoteSnapshotVersion(o).next(E=>e.Ur.setTargetsMetadata(o,o.currentSequenceNumber,r));l.push(p)}return C.waitFor(l).next(()=>a.apply(o)).next(()=>e.localDocuments.getLocalViewOfDocuments(o,h,f)).next(()=>h)}).then(o=>(e.os=s,o))}function ff(n,t,e){let r=j(),s=j();return e.forEach(o=>r=r.add(o)),t.getEntries(n,r).next(o=>{let a=Ht();return e.forEach((l,h)=>{const f=o.get(l);h.isFoundDocument()!==f.isFoundDocument()&&(s=s.add(l)),h.isNoDocument()&&h.version.isEqual(L.min())?(t.removeEntry(l,h.readTime),a=a.insert(l,h)):!f.isValidDocument()||h.version.compareTo(f.version)>0||h.version.compareTo(f.version)===0&&f.hasPendingWrites?(t.addEntry(h),a=a.insert(l,h)):O("LocalStore","Ignoring outdated watch update for ",l,". Current version:",f.version," Watch version:",h.version)}),{Ps:a,Is:s}})}function pf(n,t){const e=F(n);return e.persistence.runTransaction("Get next mutation batch","readonly",r=>(t===void 0&&(t=-1),e.mutationQueue.getNextMutationBatchAfterBatchId(r,t)))}function mf(n,t){const e=F(n);return e.persistence.runTransaction("Allocate target","readwrite",r=>{let s;return e.Ur.getTargetData(r,t).next(o=>o?(s=o,C.resolve(s)):e.Ur.allocateTargetId(r).next(a=>(s=new Jt(t,a,"TargetPurposeListen",r.currentSequenceNumber),e.Ur.addTargetData(r,s).next(()=>s))))}).then(r=>{const s=e.os.get(r.targetId);return(s===null||r.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.os=e.os.insert(r.targetId,r),e._s.set(t,r.targetId)),r})}async function Ms(n,t,e){const r=F(n),s=r.os.get(t),o=e?"readwrite":"readwrite-primary";try{e||await r.persistence.runTransaction("Release target",o,a=>r.persistence.referenceDelegate.removeTarget(a,s))}catch(a){if(!Cn(a))throw a;O("LocalStore",`Failed to update sequence numbers for target ${t}: ${a}`)}r.os=r.os.remove(t),r._s.delete(s.target)}function da(n,t,e){const r=F(n);let s=L.min(),o=j();return r.persistence.runTransaction("Execute query","readwrite",a=>function(h,f,p){const E=F(h),I=E._s.get(p);return I!==void 0?C.resolve(E.os.get(I)):E.Ur.getTargetData(f,p)}(r,a,xt(t)).next(l=>{if(l)return s=l.lastLimboFreeSnapshotVersion,r.Ur.getMatchingKeysForTargetId(a,l.targetId).next(h=>{o=h})}).next(()=>r.ss.getDocumentsMatchingQuery(a,t,e?s:L.min(),e?o:j())).next(l=>(gf(r,sd(t),l),{documents:l,Ts:o})))}function gf(n,t,e){let r=n.us.get(t)||L.min();e.forEach((s,o)=>{o.readTime.compareTo(r)>0&&(r=o.readTime)}),n.us.set(t,r)}class fa{constructor(){this.activeTargetIds=cd()}fs(t){this.activeTargetIds=this.activeTargetIds.add(t)}gs(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Vs(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class _f{constructor(){this.so=new fa,this.oo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,r){}addLocalQueryTarget(t,e=!0){return e&&this.so.fs(t),this.oo[t]||"not-current"}updateQueryState(t,e,r){this.oo[t]=e}removeLocalQueryTarget(t){this.so.gs(t)}isLocalQueryTarget(t){return this.so.activeTargetIds.has(t)}clearQueryState(t){delete this.oo[t]}getAllActiveQueryTargets(){return this.so.activeTargetIds}isActiveQueryTarget(t){return this.so.activeTargetIds.has(t)}start(){return this.so=new fa,Promise.resolve()}handleUserChange(t,e,r){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yf{_o(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pa{constructor(){this.ao=()=>this.uo(),this.co=()=>this.lo(),this.ho=[],this.Po()}_o(t){this.ho.push(t)}shutdown(){window.removeEventListener("online",this.ao),window.removeEventListener("offline",this.co)}Po(){window.addEventListener("online",this.ao),window.addEventListener("offline",this.co)}uo(){O("ConnectivityMonitor","Network connectivity changed: AVAILABLE");for(const t of this.ho)t(0)}lo(){O("ConnectivityMonitor","Network connectivity changed: UNAVAILABLE");for(const t of this.ho)t(1)}static D(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ar=null;function ms(){return ar===null?ar=function(){return 268435456+Math.round(2147483648*Math.random())}():ar++,"0x"+ar.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ef={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tf{constructor(t){this.Io=t.Io,this.To=t.To}Eo(t){this.Ao=t}Ro(t){this.Vo=t}mo(t){this.fo=t}onMessage(t){this.po=t}close(){this.To()}send(t){this.Io(t)}yo(){this.Ao()}wo(){this.Vo()}So(t){this.fo(t)}bo(t){this.po(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _t="WebChannelConnection";class vf extends class{constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const r=e.ssl?"https":"http",s=encodeURIComponent(this.databaseId.projectId),o=encodeURIComponent(this.databaseId.database);this.Do=r+"://"+e.host,this.vo=`projects/${s}/databases/${o}`,this.Co=this.databaseId.database==="(default)"?`project_id=${s}`:`project_id=${s}&database_id=${o}`}get Fo(){return!1}Mo(e,r,s,o,a){const l=ms(),h=this.xo(e,r.toUriEncodedString());O("RestConnection",`Sending RPC '${e}' ${l}:`,h,s);const f={"google-cloud-resource-prefix":this.vo,"x-goog-request-params":this.Co};return this.Oo(f,o,a),this.No(e,h,f,s).then(p=>(O("RestConnection",`Received RPC '${e}' ${l}: `,p),p),p=>{throw ke("RestConnection",`RPC '${e}' ${l} failed with error: `,p,"url: ",h,"request:",s),p})}Lo(e,r,s,o,a,l){return this.Mo(e,r,s,o,a)}Oo(e,r,s){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+Ue}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),r&&r.headers.forEach((o,a)=>e[a]=o),s&&s.headers.forEach((o,a)=>e[a]=o)}xo(e,r){const s=Ef[e];return`${this.Do}/v1/${r}:${s}`}terminate(){}}{constructor(t){super(t),this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}No(t,e,r,s){const o=ms();return new Promise((a,l)=>{const h=new Wa;h.setWithCredentials(!0),h.listenOnce(Qa.COMPLETE,()=>{try{switch(h.getLastErrorCode()){case cr.NO_ERROR:const p=h.getResponseJson();O(_t,`XHR for RPC '${t}' ${o} received:`,JSON.stringify(p)),a(p);break;case cr.TIMEOUT:O(_t,`RPC '${t}' ${o} timed out`),l(new k(b.DEADLINE_EXCEEDED,"Request time out"));break;case cr.HTTP_ERROR:const E=h.getStatus();if(O(_t,`RPC '${t}' ${o} failed with status:`,E,"response text:",h.getResponseText()),E>0){let I=h.getResponseJson();Array.isArray(I)&&(I=I[0]);const P=I==null?void 0:I.error;if(P&&P.status&&P.message){const V=function(S){const U=S.toLowerCase().replace(/_/g,"-");return Object.values(b).indexOf(U)>=0?U:b.UNKNOWN}(P.status);l(new k(V,P.message))}else l(new k(b.UNKNOWN,"Server responded with status "+h.getStatus()))}else l(new k(b.UNAVAILABLE,"Connection failed."));break;default:M()}}finally{O(_t,`RPC '${t}' ${o} completed.`)}});const f=JSON.stringify(s);O(_t,`RPC '${t}' ${o} sending request:`,s),h.send(e,"POST",f,r,15)})}Bo(t,e,r){const s=ms(),o=[this.Do,"/","google.firestore.v1.Firestore","/",t,"/channel"],a=Ja(),l=Ya(),h={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},f=this.longPollingOptions.timeoutSeconds;f!==void 0&&(h.longPollingTimeout=Math.round(1e3*f)),this.useFetchStreams&&(h.useFetchStreams=!0),this.Oo(h.initMessageHeaders,e,r),h.encodeInitMessageHeaders=!0;const p=o.join("");O(_t,`Creating RPC '${t}' stream ${s}: ${p}`,h);const E=a.createWebChannel(p,h);let I=!1,P=!1;const V=new Tf({Io:S=>{P?O(_t,`Not sending because RPC '${t}' stream ${s} is closed:`,S):(I||(O(_t,`Opening RPC '${t}' stream ${s} transport.`),E.open(),I=!0),O(_t,`RPC '${t}' stream ${s} sending:`,S),E.send(S))},To:()=>E.close()}),N=(S,U,q)=>{S.listen(U,B=>{try{q(B)}catch(z){setTimeout(()=>{throw z},0)}})};return N(E,un.EventType.OPEN,()=>{P||(O(_t,`RPC '${t}' stream ${s} transport opened.`),V.yo())}),N(E,un.EventType.CLOSE,()=>{P||(P=!0,O(_t,`RPC '${t}' stream ${s} transport closed`),V.So())}),N(E,un.EventType.ERROR,S=>{P||(P=!0,ke(_t,`RPC '${t}' stream ${s} transport errored:`,S),V.So(new k(b.UNAVAILABLE,"The operation could not be completed")))}),N(E,un.EventType.MESSAGE,S=>{var U;if(!P){const q=S.data[0];W(!!q);const B=q,z=B.error||((U=B[0])===null||U===void 0?void 0:U.error);if(z){O(_t,`RPC '${t}' stream ${s} received error:`,z);const bt=z.status;let nt=function(_){const y=st[_];if(y!==void 0)return Iu(y)}(bt),v=z.message;nt===void 0&&(nt=b.INTERNAL,v="Unknown error status: "+bt+" with message "+z.message),P=!0,V.So(new k(nt,v)),E.close()}else O(_t,`RPC '${t}' stream ${s} received:`,q),V.bo(q)}}),N(l,Xa.STAT_EVENT,S=>{S.stat===Ps.PROXY?O(_t,`RPC '${t}' stream ${s} detected buffering proxy`):S.stat===Ps.NOPROXY&&O(_t,`RPC '${t}' stream ${s} detected no buffering proxy`)}),setTimeout(()=>{V.wo()},0),V}}function gs(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Or(n){return new Vd(n,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xu{constructor(t,e,r=1e3,s=1.5,o=6e4){this.ui=t,this.timerId=e,this.ko=r,this.qo=s,this.Qo=o,this.Ko=0,this.$o=null,this.Uo=Date.now(),this.reset()}reset(){this.Ko=0}Wo(){this.Ko=this.Qo}Go(t){this.cancel();const e=Math.floor(this.Ko+this.zo()),r=Math.max(0,Date.now()-this.Uo),s=Math.max(0,e-r);s>0&&O("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Ko} ms, delay with jitter: ${e} ms, last attempt: ${r} ms ago)`),this.$o=this.ui.enqueueAfterDelay(this.timerId,s,()=>(this.Uo=Date.now(),t())),this.Ko*=this.qo,this.Ko<this.ko&&(this.Ko=this.ko),this.Ko>this.Qo&&(this.Ko=this.Qo)}jo(){this.$o!==null&&(this.$o.skipDelay(),this.$o=null)}cancel(){this.$o!==null&&(this.$o.cancel(),this.$o=null)}zo(){return(Math.random()-.5)*this.Ko}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mu{constructor(t,e,r,s,o,a,l,h){this.ui=t,this.Ho=r,this.Jo=s,this.connection=o,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=l,this.listener=h,this.state=0,this.Yo=0,this.Zo=null,this.Xo=null,this.stream=null,this.e_=0,this.t_=new xu(t,e)}n_(){return this.state===1||this.state===5||this.r_()}r_(){return this.state===2||this.state===3}start(){this.e_=0,this.state!==4?this.auth():this.i_()}async stop(){this.n_()&&await this.close(0)}s_(){this.state=0,this.t_.reset()}o_(){this.r_()&&this.Zo===null&&(this.Zo=this.ui.enqueueAfterDelay(this.Ho,6e4,()=>this.__()))}a_(t){this.u_(),this.stream.send(t)}async __(){if(this.r_())return this.close(0)}u_(){this.Zo&&(this.Zo.cancel(),this.Zo=null)}c_(){this.Xo&&(this.Xo.cancel(),this.Xo=null)}async close(t,e){this.u_(),this.c_(),this.t_.cancel(),this.Yo++,t!==4?this.t_.reset():e&&e.code===b.RESOURCE_EXHAUSTED?(Gt(e.toString()),Gt("Using maximum backoff delay to prevent overloading the backend."),this.t_.Wo()):e&&e.code===b.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.l_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.mo(e)}l_(){}auth(){this.state=1;const t=this.h_(this.Yo),e=this.Yo;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,s])=>{this.Yo===e&&this.P_(r,s)},r=>{t(()=>{const s=new k(b.UNKNOWN,"Fetching auth token failed: "+r.message);return this.I_(s)})})}P_(t,e){const r=this.h_(this.Yo);this.stream=this.T_(t,e),this.stream.Eo(()=>{r(()=>this.listener.Eo())}),this.stream.Ro(()=>{r(()=>(this.state=2,this.Xo=this.ui.enqueueAfterDelay(this.Jo,1e4,()=>(this.r_()&&(this.state=3),Promise.resolve())),this.listener.Ro()))}),this.stream.mo(s=>{r(()=>this.I_(s))}),this.stream.onMessage(s=>{r(()=>++this.e_==1?this.E_(s):this.onNext(s))})}i_(){this.state=5,this.t_.Go(async()=>{this.state=0,this.start()})}I_(t){return O("PersistentStream",`close with error: ${t}`),this.stream=null,this.close(4,t)}h_(t){return e=>{this.ui.enqueueAndForget(()=>this.Yo===t?e():(O("PersistentStream","stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class wf extends Mu{constructor(t,e,r,s,o,a){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}T_(t,e){return this.connection.Bo("Listen",t,e)}E_(t){return this.onNext(t)}onNext(t){this.t_.reset();const e=Nd(this.serializer,t),r=function(o){if(!("targetChange"in o))return L.min();const a=o.targetChange;return a.targetIds&&a.targetIds.length?L.min():a.readTime?Mt(a.readTime):L.min()}(t);return this.listener.d_(e,r)}A_(t){const e={};e.database=xs(this.serializer),e.addTarget=function(o,a){let l;const h=a.target;if(l=Vs(h)?{documents:Md(o,h)}:{query:Ld(o,h)._t},l.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){l.resumeToken=Pu(o,a.resumeToken);const f=ks(o,a.expectedCount);f!==null&&(l.expectedCount=f)}else if(a.snapshotVersion.compareTo(L.min())>0){l.readTime=Tr(o,a.snapshotVersion.toTimestamp());const f=ks(o,a.expectedCount);f!==null&&(l.expectedCount=f)}return l}(this.serializer,t);const r=Ud(this.serializer,t);r&&(e.labels=r),this.a_(e)}R_(t){const e={};e.database=xs(this.serializer),e.removeTarget=t,this.a_(e)}}class If extends Mu{constructor(t,e,r,s,o,a){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,r,s,a),this.serializer=o}get V_(){return this.e_>0}start(){this.lastStreamToken=void 0,super.start()}l_(){this.V_&&this.m_([])}T_(t,e){return this.connection.Bo("Write",t,e)}E_(t){return W(!!t.streamToken),this.lastStreamToken=t.streamToken,W(!t.writeResults||t.writeResults.length===0),this.listener.f_()}onNext(t){W(!!t.streamToken),this.lastStreamToken=t.streamToken,this.t_.reset();const e=xd(t.writeResults,t.commitTime),r=Mt(t.commitTime);return this.listener.g_(r,e)}p_(){const t={};t.database=xs(this.serializer),this.a_(t)}m_(t){const e={streamToken:this.lastStreamToken,writes:t.map(r=>Od(this.serializer,r))};this.a_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Af extends class{}{constructor(t,e,r,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=r,this.serializer=s,this.y_=!1}w_(){if(this.y_)throw new k(b.FAILED_PRECONDITION,"The client has already been terminated.")}Mo(t,e,r,s){return this.w_(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,a])=>this.connection.Mo(t,Ns(e,r),s,o,a)).catch(o=>{throw o.name==="FirebaseError"?(o.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new k(b.UNKNOWN,o.toString())})}Lo(t,e,r,s,o){return this.w_(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([a,l])=>this.connection.Lo(t,Ns(e,r),s,a,l,o)).catch(a=>{throw a.name==="FirebaseError"?(a.code===b.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new k(b.UNKNOWN,a.toString())})}terminate(){this.y_=!0,this.connection.terminate()}}class Rf{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.S_=0,this.b_=null,this.D_=!0}v_(){this.S_===0&&(this.C_("Unknown"),this.b_=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.b_=null,this.F_("Backend didn't respond within 10 seconds."),this.C_("Offline"),Promise.resolve())))}M_(t){this.state==="Online"?this.C_("Unknown"):(this.S_++,this.S_>=1&&(this.x_(),this.F_(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.C_("Offline")))}set(t){this.x_(),this.S_=0,t==="Online"&&(this.D_=!1),this.C_(t)}C_(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}F_(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.D_?(Gt(e),this.D_=!1):O("OnlineStateTracker",e)}x_(){this.b_!==null&&(this.b_.cancel(),this.b_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pf{constructor(t,e,r,s,o){this.localStore=t,this.datastore=e,this.asyncQueue=r,this.remoteSyncer={},this.O_=[],this.N_=new Map,this.L_=new Set,this.B_=[],this.k_=o,this.k_._o(a=>{r.enqueueAndForget(async()=>{ve(this)&&(O("RemoteStore","Restarting streams for network reachability change."),await async function(h){const f=F(h);f.L_.add(4),await Dn(f),f.q_.set("Unknown"),f.L_.delete(4),await xr(f)}(this))})}),this.q_=new Rf(r,s)}}async function xr(n){if(ve(n))for(const t of n.B_)await t(!0)}async function Dn(n){for(const t of n.B_)await t(!1)}function Lu(n,t){const e=F(n);e.N_.has(t.targetId)||(e.N_.set(t.targetId,t),oi(e)?ii(e):qe(e).r_()&&si(e,t))}function ri(n,t){const e=F(n),r=qe(e);e.N_.delete(t),r.r_()&&Fu(e,t),e.N_.size===0&&(r.r_()?r.o_():ve(e)&&e.q_.set("Unknown"))}function si(n,t){if(n.Q_.xe(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(L.min())>0){const e=n.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}qe(n).A_(t)}function Fu(n,t){n.Q_.xe(t),qe(n).R_(t)}function ii(n){n.Q_=new Pd({getRemoteKeysForTarget:t=>n.remoteSyncer.getRemoteKeysForTarget(t),ot:t=>n.N_.get(t)||null,tt:()=>n.datastore.serializer.databaseId}),qe(n).start(),n.q_.v_()}function oi(n){return ve(n)&&!qe(n).n_()&&n.N_.size>0}function ve(n){return F(n).L_.size===0}function Uu(n){n.Q_=void 0}async function bf(n){n.q_.set("Online")}async function Cf(n){n.N_.forEach((t,e)=>{si(n,t)})}async function Sf(n,t){Uu(n),oi(n)?(n.q_.M_(t),ii(n)):n.q_.set("Unknown")}async function Vf(n,t,e){if(n.q_.set("Online"),t instanceof Ru&&t.state===2&&t.cause)try{await async function(s,o){const a=o.cause;for(const l of o.targetIds)s.N_.has(l)&&(await s.remoteSyncer.rejectListen(l,a),s.N_.delete(l),s.Q_.removeTarget(l))}(n,t)}catch(r){O("RemoteStore","Failed to remove targets %s: %s ",t.targetIds.join(","),r),await vr(n,r)}else if(t instanceof fr?n.Q_.Ke(t):t instanceof Au?n.Q_.He(t):n.Q_.We(t),!e.isEqual(L.min()))try{const r=await Ou(n.localStore);e.compareTo(r)>=0&&await function(o,a){const l=o.Q_.rt(a);return l.targetChanges.forEach((h,f)=>{if(h.resumeToken.approximateByteSize()>0){const p=o.N_.get(f);p&&o.N_.set(f,p.withResumeToken(h.resumeToken,a))}}),l.targetMismatches.forEach((h,f)=>{const p=o.N_.get(h);if(!p)return;o.N_.set(h,p.withResumeToken(dt.EMPTY_BYTE_STRING,p.snapshotVersion)),Fu(o,h);const E=new Jt(p.target,h,f,p.sequenceNumber);si(o,E)}),o.remoteSyncer.applyRemoteEvent(l)}(n,e)}catch(r){O("RemoteStore","Failed to raise snapshot:",r),await vr(n,r)}}async function vr(n,t,e){if(!Cn(t))throw t;n.L_.add(1),await Dn(n),n.q_.set("Offline"),e||(e=()=>Ou(n.localStore)),n.asyncQueue.enqueueRetryable(async()=>{O("RemoteStore","Retrying IndexedDB access"),await e(),n.L_.delete(1),await xr(n)})}function Bu(n,t){return t().catch(e=>vr(n,e,t))}async function Mr(n){const t=F(n),e=re(t);let r=t.O_.length>0?t.O_[t.O_.length-1].batchId:-1;for(;Df(t);)try{const s=await pf(t.localStore,r);if(s===null){t.O_.length===0&&e.o_();break}r=s.batchId,kf(t,s)}catch(s){await vr(t,s)}qu(t)&&ju(t)}function Df(n){return ve(n)&&n.O_.length<10}function kf(n,t){n.O_.push(t);const e=re(n);e.r_()&&e.V_&&e.m_(t.mutations)}function qu(n){return ve(n)&&!re(n).n_()&&n.O_.length>0}function ju(n){re(n).start()}async function Nf(n){re(n).p_()}async function Of(n){const t=re(n);for(const e of n.O_)t.m_(e.mutations)}async function xf(n,t,e){const r=n.O_.shift(),s=Ys.from(r,t,e);await Bu(n,()=>n.remoteSyncer.applySuccessfulWrite(s)),await Mr(n)}async function Mf(n,t){t&&re(n).V_&&await async function(r,s){if(function(a){return Id(a)&&a!==b.ABORTED}(s.code)){const o=r.O_.shift();re(r).s_(),await Bu(r,()=>r.remoteSyncer.rejectFailedWrite(o.batchId,s)),await Mr(r)}}(n,t),qu(n)&&ju(n)}async function ma(n,t){const e=F(n);e.asyncQueue.verifyOperationInProgress(),O("RemoteStore","RemoteStore received new credentials");const r=ve(e);e.L_.add(3),await Dn(e),r&&e.q_.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.L_.delete(3),await xr(e)}async function Lf(n,t){const e=F(n);t?(e.L_.delete(2),await xr(e)):t||(e.L_.add(2),await Dn(e),e.q_.set("Unknown"))}function qe(n){return n.K_||(n.K_=function(e,r,s){const o=F(e);return o.w_(),new wf(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Eo:bf.bind(null,n),Ro:Cf.bind(null,n),mo:Sf.bind(null,n),d_:Vf.bind(null,n)}),n.B_.push(async t=>{t?(n.K_.s_(),oi(n)?ii(n):n.q_.set("Unknown")):(await n.K_.stop(),Uu(n))})),n.K_}function re(n){return n.U_||(n.U_=function(e,r,s){const o=F(e);return o.w_(),new If(r,o.connection,o.authCredentials,o.appCheckCredentials,o.serializer,s)}(n.datastore,n.asyncQueue,{Eo:()=>Promise.resolve(),Ro:Nf.bind(null,n),mo:Mf.bind(null,n),f_:Of.bind(null,n),g_:xf.bind(null,n)}),n.B_.push(async t=>{t?(n.U_.s_(),await Mr(n)):(await n.U_.stop(),n.O_.length>0&&(O("RemoteStore",`Stopping write stream with ${n.O_.length} pending writes`),n.O_=[]))})),n.U_}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ai{constructor(t,e,r,s,o){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=r,this.op=s,this.removalCallback=o,this.deferred=new $t,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(a=>{})}get promise(){return this.deferred.promise}static createAndSchedule(t,e,r,s,o){const a=Date.now()+r,l=new ai(t,e,a,s,o);return l.start(r),l}start(t){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new k(b.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(t=>this.deferred.resolve(t))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function ui(n,t){if(Gt("AsyncQueue",`${t}: ${n}`),Cn(n))return new k(b.UNAVAILABLE,`${t}: ${n}`);throw n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Se{constructor(t){this.comparator=t?(e,r)=>t(e,r)||x.comparator(e.key,r.key):(e,r)=>x.comparator(e.key,r.key),this.keyedMap=ln(),this.sortedSet=new J(this.comparator)}static emptySet(t){return new Se(t.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal((e,r)=>(t(e),!1))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Se)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),r=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,o=r.getNext().key;if(!s.isEqual(o))return!1}return!0}toString(){const t=[];return this.forEach(e=>{t.push(e.toString())}),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const r=new Se;return r.comparator=this.comparator,r.keyedMap=t,r.sortedSet=e,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ga{constructor(){this.W_=new J(x.comparator)}track(t){const e=t.doc.key,r=this.W_.get(e);r?t.type!==0&&r.type===3?this.W_=this.W_.insert(e,t):t.type===3&&r.type!==1?this.W_=this.W_.insert(e,{type:r.type,doc:t.doc}):t.type===2&&r.type===2?this.W_=this.W_.insert(e,{type:2,doc:t.doc}):t.type===2&&r.type===0?this.W_=this.W_.insert(e,{type:0,doc:t.doc}):t.type===1&&r.type===0?this.W_=this.W_.remove(e):t.type===1&&r.type===2?this.W_=this.W_.insert(e,{type:1,doc:r.doc}):t.type===0&&r.type===1?this.W_=this.W_.insert(e,{type:2,doc:t.doc}):M():this.W_=this.W_.insert(e,t)}G_(){const t=[];return this.W_.inorderTraversal((e,r)=>{t.push(r)}),t}}class Le{constructor(t,e,r,s,o,a,l,h,f){this.query=t,this.docs=e,this.oldDocs=r,this.docChanges=s,this.mutatedKeys=o,this.fromCache=a,this.syncStateChanged=l,this.excludesMetadataChanges=h,this.hasCachedResults=f}static fromInitialDocuments(t,e,r,s,o){const a=[];return e.forEach(l=>{a.push({type:0,doc:l})}),new Le(t,e,Se.emptySet(e),a,r,s,!0,!1,o)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&Cr(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,r=t.docChanges;if(e.length!==r.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==r[s].type||!e[s].doc.isEqual(r[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ff{constructor(){this.z_=void 0,this.j_=[]}H_(){return this.j_.some(t=>t.J_())}}class Uf{constructor(){this.queries=_a(),this.onlineState="Unknown",this.Y_=new Set}terminate(){(function(e,r){const s=F(e),o=s.queries;s.queries=_a(),o.forEach((a,l)=>{for(const h of l.j_)h.onError(r)})})(this,new k(b.ABORTED,"Firestore shutting down"))}}function _a(){return new Be(n=>hu(n),Cr)}async function li(n,t){const e=F(n);let r=3;const s=t.query;let o=e.queries.get(s);o?!o.H_()&&t.J_()&&(r=2):(o=new Ff,r=t.J_()?0:1);try{switch(r){case 0:o.z_=await e.onListen(s,!0);break;case 1:o.z_=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(a){const l=ui(a,`Initialization of query '${Pe(t.query)}' failed`);return void t.onError(l)}e.queries.set(s,o),o.j_.push(t),t.Z_(e.onlineState),o.z_&&t.X_(o.z_)&&hi(e)}async function ci(n,t){const e=F(n),r=t.query;let s=3;const o=e.queries.get(r);if(o){const a=o.j_.indexOf(t);a>=0&&(o.j_.splice(a,1),o.j_.length===0?s=t.J_()?0:1:!o.H_()&&t.J_()&&(s=2))}switch(s){case 0:return e.queries.delete(r),e.onUnlisten(r,!0);case 1:return e.queries.delete(r),e.onUnlisten(r,!1);case 2:return e.onLastRemoteStoreUnlisten(r);default:return}}function Bf(n,t){const e=F(n);let r=!1;for(const s of t){const o=s.query,a=e.queries.get(o);if(a){for(const l of a.j_)l.X_(s)&&(r=!0);a.z_=s}}r&&hi(e)}function qf(n,t,e){const r=F(n),s=r.queries.get(t);if(s)for(const o of s.j_)o.onError(e);r.queries.delete(t)}function hi(n){n.Y_.forEach(t=>{t.next()})}var Ls,ya;(ya=Ls||(Ls={})).ea="default",ya.Cache="cache";class di{constructor(t,e,r){this.query=t,this.ta=e,this.na=!1,this.ra=null,this.onlineState="Unknown",this.options=r||{}}X_(t){if(!this.options.includeMetadataChanges){const r=[];for(const s of t.docChanges)s.type!==3&&r.push(s);t=new Le(t.query,t.docs,t.oldDocs,r,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.na?this.ia(t)&&(this.ta.next(t),e=!0):this.sa(t,this.onlineState)&&(this.oa(t),e=!0),this.ra=t,e}onError(t){this.ta.error(t)}Z_(t){this.onlineState=t;let e=!1;return this.ra&&!this.na&&this.sa(this.ra,t)&&(this.oa(this.ra),e=!0),e}sa(t,e){if(!t.fromCache||!this.J_())return!0;const r=e!=="Offline";return(!this.options._a||!r)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}ia(t){if(t.docChanges.length>0)return!0;const e=this.ra&&this.ra.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}oa(t){t=Le.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.na=!0,this.ta.next(t)}J_(){return this.options.source!==Ls.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $u{constructor(t){this.key=t}}class zu{constructor(t){this.key=t}}class jf{constructor(t,e){this.query=t,this.Ta=e,this.Ea=null,this.hasCachedResults=!1,this.current=!1,this.da=j(),this.mutatedKeys=j(),this.Aa=du(t),this.Ra=new Se(this.Aa)}get Va(){return this.Ta}ma(t,e){const r=e?e.fa:new ga,s=e?e.Ra:this.Ra;let o=e?e.mutatedKeys:this.mutatedKeys,a=s,l=!1;const h=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,f=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal((p,E)=>{const I=s.get(p),P=Sr(this.query,E)?E:null,V=!!I&&this.mutatedKeys.has(I.key),N=!!P&&(P.hasLocalMutations||this.mutatedKeys.has(P.key)&&P.hasCommittedMutations);let S=!1;I&&P?I.data.isEqual(P.data)?V!==N&&(r.track({type:3,doc:P}),S=!0):this.ga(I,P)||(r.track({type:2,doc:P}),S=!0,(h&&this.Aa(P,h)>0||f&&this.Aa(P,f)<0)&&(l=!0)):!I&&P?(r.track({type:0,doc:P}),S=!0):I&&!P&&(r.track({type:1,doc:I}),S=!0,(h||f)&&(l=!0)),S&&(P?(a=a.add(P),o=N?o.add(p):o.delete(p)):(a=a.delete(p),o=o.delete(p)))}),this.query.limit!==null)for(;a.size>this.query.limit;){const p=this.query.limitType==="F"?a.last():a.first();a=a.delete(p.key),o=o.delete(p.key),r.track({type:1,doc:p})}return{Ra:a,fa:r,ns:l,mutatedKeys:o}}ga(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,r,s){const o=this.Ra;this.Ra=t.Ra,this.mutatedKeys=t.mutatedKeys;const a=t.fa.G_();a.sort((p,E)=>function(P,V){const N=S=>{switch(S){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return M()}};return N(P)-N(V)}(p.type,E.type)||this.Aa(p.doc,E.doc)),this.pa(r),s=s!=null&&s;const l=e&&!s?this.ya():[],h=this.da.size===0&&this.current&&!s?1:0,f=h!==this.Ea;return this.Ea=h,a.length!==0||f?{snapshot:new Le(this.query,t.Ra,o,a,t.mutatedKeys,h===0,f,!1,!!r&&r.resumeToken.approximateByteSize()>0),wa:l}:{wa:l}}Z_(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({Ra:this.Ra,fa:new ga,mutatedKeys:this.mutatedKeys,ns:!1},!1)):{wa:[]}}Sa(t){return!this.Ta.has(t)&&!!this.Ra.has(t)&&!this.Ra.get(t).hasLocalMutations}pa(t){t&&(t.addedDocuments.forEach(e=>this.Ta=this.Ta.add(e)),t.modifiedDocuments.forEach(e=>{}),t.removedDocuments.forEach(e=>this.Ta=this.Ta.delete(e)),this.current=t.current)}ya(){if(!this.current)return[];const t=this.da;this.da=j(),this.Ra.forEach(r=>{this.Sa(r.key)&&(this.da=this.da.add(r.key))});const e=[];return t.forEach(r=>{this.da.has(r)||e.push(new zu(r))}),this.da.forEach(r=>{t.has(r)||e.push(new $u(r))}),e}ba(t){this.Ta=t.Ts,this.da=j();const e=this.ma(t.documents);return this.applyChanges(e,!0)}Da(){return Le.fromInitialDocuments(this.query,this.Ra,this.mutatedKeys,this.Ea===0,this.hasCachedResults)}}class $f{constructor(t,e,r){this.query=t,this.targetId=e,this.view=r}}class zf{constructor(t){this.key=t,this.va=!1}}class Gf{constructor(t,e,r,s,o,a){this.localStore=t,this.remoteStore=e,this.eventManager=r,this.sharedClientState=s,this.currentUser=o,this.maxConcurrentLimboResolutions=a,this.Ca={},this.Fa=new Be(l=>hu(l),Cr),this.Ma=new Map,this.xa=new Set,this.Oa=new J(x.comparator),this.Na=new Map,this.La=new ti,this.Ba={},this.ka=new Map,this.qa=Me.kn(),this.onlineState="Unknown",this.Qa=void 0}get isPrimaryClient(){return this.Qa===!0}}async function Hf(n,t,e=!0){const r=Xu(n);let s;const o=r.Fa.get(t);return o?(r.sharedClientState.addLocalQueryTarget(o.targetId),s=o.view.Da()):s=await Gu(r,t,e,!0),s}async function Kf(n,t){const e=Xu(n);await Gu(e,t,!0,!1)}async function Gu(n,t,e,r){const s=await mf(n.localStore,xt(t)),o=s.targetId,a=n.sharedClientState.addLocalQueryTarget(o,e);let l;return r&&(l=await Wf(n,t,o,a==="current",s.resumeToken)),n.isPrimaryClient&&e&&Lu(n.remoteStore,s),l}async function Wf(n,t,e,r,s){n.Ka=(E,I,P)=>async function(N,S,U,q){let B=S.view.ma(U);B.ns&&(B=await da(N.localStore,S.query,!1).then(({documents:v})=>S.view.ma(v,B)));const z=q&&q.targetChanges.get(S.targetId),bt=q&&q.targetMismatches.get(S.targetId)!=null,nt=S.view.applyChanges(B,N.isPrimaryClient,z,bt);return Ta(N,S.targetId,nt.wa),nt.snapshot}(n,E,I,P);const o=await da(n.localStore,t,!0),a=new jf(t,o.Ts),l=a.ma(o.documents),h=Vn.createSynthesizedTargetChangeForCurrentChange(e,r&&n.onlineState!=="Offline",s),f=a.applyChanges(l,n.isPrimaryClient,h);Ta(n,e,f.wa);const p=new $f(t,e,a);return n.Fa.set(t,p),n.Ma.has(e)?n.Ma.get(e).push(t):n.Ma.set(e,[t]),f.snapshot}async function Qf(n,t,e){const r=F(n),s=r.Fa.get(t),o=r.Ma.get(s.targetId);if(o.length>1)return r.Ma.set(s.targetId,o.filter(a=>!Cr(a,t))),void r.Fa.delete(t);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(s.targetId),r.sharedClientState.isActiveQueryTarget(s.targetId)||await Ms(r.localStore,s.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(s.targetId),e&&ri(r.remoteStore,s.targetId),Fs(r,s.targetId)}).catch(bn)):(Fs(r,s.targetId),await Ms(r.localStore,s.targetId,!0))}async function Xf(n,t){const e=F(n),r=e.Fa.get(t),s=e.Ma.get(r.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(r.targetId),ri(e.remoteStore,r.targetId))}async function Yf(n,t,e){const r=sp(n);try{const s=await function(a,l){const h=F(a),f=ot.now(),p=l.reduce((P,V)=>P.add(V.key),j());let E,I;return h.persistence.runTransaction("Locally write mutations","readwrite",P=>{let V=Ht(),N=j();return h.cs.getEntries(P,p).next(S=>{V=S,V.forEach((U,q)=>{q.isValidDocument()||(N=N.add(U))})}).next(()=>h.localDocuments.getOverlayedDocuments(P,V)).next(S=>{E=S;const U=[];for(const q of l){const B=yd(q,E.get(q.key).overlayedDocument);B!=null&&U.push(new se(q.key,B,ru(B.value.mapValue),Pt.exists(!0)))}return h.mutationQueue.addMutationBatch(P,f,U,l)}).next(S=>{I=S;const U=S.applyToLocalDocumentSet(E,N);return h.documentOverlayCache.saveOverlays(P,S.batchId,U)})}).then(()=>({batchId:I.batchId,changes:pu(E)}))}(r.localStore,t);r.sharedClientState.addPendingMutation(s.batchId),function(a,l,h){let f=a.Ba[a.currentUser.toKey()];f||(f=new J(K)),f=f.insert(l,h),a.Ba[a.currentUser.toKey()]=f}(r,s.batchId,e),await kn(r,s.changes),await Mr(r.remoteStore)}catch(s){const o=ui(s,"Failed to persist write");e.reject(o)}}async function Hu(n,t){const e=F(n);try{const r=await df(e.localStore,t);t.targetChanges.forEach((s,o)=>{const a=e.Na.get(o);a&&(W(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1),s.addedDocuments.size>0?a.va=!0:s.modifiedDocuments.size>0?W(a.va):s.removedDocuments.size>0&&(W(a.va),a.va=!1))}),await kn(e,r,t)}catch(r){await bn(r)}}function Ea(n,t,e){const r=F(n);if(r.isPrimaryClient&&e===0||!r.isPrimaryClient&&e===1){const s=[];r.Fa.forEach((o,a)=>{const l=a.view.Z_(t);l.snapshot&&s.push(l.snapshot)}),function(a,l){const h=F(a);h.onlineState=l;let f=!1;h.queries.forEach((p,E)=>{for(const I of E.j_)I.Z_(l)&&(f=!0)}),f&&hi(h)}(r.eventManager,t),s.length&&r.Ca.d_(s),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function Jf(n,t,e){const r=F(n);r.sharedClientState.updateQueryState(t,"rejected",e);const s=r.Na.get(t),o=s&&s.key;if(o){let a=new J(x.comparator);a=a.insert(o,Et.newNoDocument(o,L.min()));const l=j().add(o),h=new Nr(L.min(),new Map,new J(K),a,l);await Hu(r,h),r.Oa=r.Oa.remove(o),r.Na.delete(t),fi(r)}else await Ms(r.localStore,t,!1).then(()=>Fs(r,t,e)).catch(bn)}async function Zf(n,t){const e=F(n),r=t.batch.batchId;try{const s=await hf(e.localStore,t);Wu(e,r,null),Ku(e,r),e.sharedClientState.updateMutationState(r,"acknowledged"),await kn(e,s)}catch(s){await bn(s)}}async function tp(n,t,e){const r=F(n);try{const s=await function(a,l){const h=F(a);return h.persistence.runTransaction("Reject batch","readwrite-primary",f=>{let p;return h.mutationQueue.lookupMutationBatch(f,l).next(E=>(W(E!==null),p=E.keys(),h.mutationQueue.removeMutationBatch(f,E))).next(()=>h.mutationQueue.performConsistencyCheck(f)).next(()=>h.documentOverlayCache.removeOverlaysForBatchId(f,p,l)).next(()=>h.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(f,p)).next(()=>h.localDocuments.getDocuments(f,p))})}(r.localStore,t);Wu(r,t,e),Ku(r,t),r.sharedClientState.updateMutationState(t,"rejected",e),await kn(r,s)}catch(s){await bn(s)}}function Ku(n,t){(n.ka.get(t)||[]).forEach(e=>{e.resolve()}),n.ka.delete(t)}function Wu(n,t,e){const r=F(n);let s=r.Ba[r.currentUser.toKey()];if(s){const o=s.get(t);o&&(e?o.reject(e):o.resolve(),s=s.remove(t)),r.Ba[r.currentUser.toKey()]=s}}function Fs(n,t,e=null){n.sharedClientState.removeLocalQueryTarget(t);for(const r of n.Ma.get(t))n.Fa.delete(r),e&&n.Ca.$a(r,e);n.Ma.delete(t),n.isPrimaryClient&&n.La.gr(t).forEach(r=>{n.La.containsKey(r)||Qu(n,r)})}function Qu(n,t){n.xa.delete(t.path.canonicalString());const e=n.Oa.get(t);e!==null&&(ri(n.remoteStore,e),n.Oa=n.Oa.remove(t),n.Na.delete(e),fi(n))}function Ta(n,t,e){for(const r of e)r instanceof $u?(n.La.addReference(r.key,t),ep(n,r)):r instanceof zu?(O("SyncEngine","Document no longer in limbo: "+r.key),n.La.removeReference(r.key,t),n.La.containsKey(r.key)||Qu(n,r.key)):M()}function ep(n,t){const e=t.key,r=e.path.canonicalString();n.Oa.get(e)||n.xa.has(r)||(O("SyncEngine","New document in limbo: "+e),n.xa.add(r),fi(n))}function fi(n){for(;n.xa.size>0&&n.Oa.size<n.maxConcurrentLimboResolutions;){const t=n.xa.values().next().value;n.xa.delete(t);const e=new x(X.fromString(t)),r=n.qa.next();n.Na.set(r,new zf(e)),n.Oa=n.Oa.insert(e,r),Lu(n.remoteStore,new Jt(xt(br(e.path)),r,"TargetPurposeLimboResolution",zs.oe))}}async function kn(n,t,e){const r=F(n),s=[],o=[],a=[];r.Fa.isEmpty()||(r.Fa.forEach((l,h)=>{a.push(r.Ka(h,t,e).then(f=>{var p;if((f||e)&&r.isPrimaryClient){const E=f?!f.fromCache:(p=e==null?void 0:e.targetChanges.get(h.targetId))===null||p===void 0?void 0:p.current;r.sharedClientState.updateQueryState(h.targetId,E?"current":"not-current")}if(f){s.push(f);const E=ni.Wi(h.targetId,f);o.push(E)}}))}),await Promise.all(a),r.Ca.d_(s),await async function(h,f){const p=F(h);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",E=>C.forEach(f,I=>C.forEach(I.$i,P=>p.persistence.referenceDelegate.addReference(E,I.targetId,P)).next(()=>C.forEach(I.Ui,P=>p.persistence.referenceDelegate.removeReference(E,I.targetId,P)))))}catch(E){if(!Cn(E))throw E;O("LocalStore","Failed to update sequence numbers: "+E)}for(const E of f){const I=E.targetId;if(!E.fromCache){const P=p.os.get(I),V=P.snapshotVersion,N=P.withLastLimboFreeSnapshotVersion(V);p.os=p.os.insert(I,N)}}}(r.localStore,o))}async function np(n,t){const e=F(n);if(!e.currentUser.isEqual(t)){O("SyncEngine","User change. New user:",t.toKey());const r=await Nu(e.localStore,t);e.currentUser=t,function(o,a){o.ka.forEach(l=>{l.forEach(h=>{h.reject(new k(b.CANCELLED,a))})}),o.ka.clear()}(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,r.removedBatchIds,r.addedBatchIds),await kn(e,r.hs)}}function rp(n,t){const e=F(n),r=e.Na.get(t);if(r&&r.va)return j().add(r.key);{let s=j();const o=e.Ma.get(t);if(!o)return s;for(const a of o){const l=e.Fa.get(a);s=s.unionWith(l.view.Va)}return s}}function Xu(n){const t=F(n);return t.remoteStore.remoteSyncer.applyRemoteEvent=Hu.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=rp.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Jf.bind(null,t),t.Ca.d_=Bf.bind(null,t.eventManager),t.Ca.$a=qf.bind(null,t.eventManager),t}function sp(n){const t=F(n);return t.remoteStore.remoteSyncer.applySuccessfulWrite=Zf.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=tp.bind(null,t),t}class wr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=Or(t.databaseInfo.databaseId),this.sharedClientState=this.Wa(t),this.persistence=this.Ga(t),await this.persistence.start(),this.localStore=this.za(t),this.gcScheduler=this.ja(t,this.localStore),this.indexBackfillerScheduler=this.Ha(t,this.localStore)}ja(t,e){return null}Ha(t,e){return null}za(t){return cf(this.persistence,new uf,t.initialUser,this.serializer)}Ga(t){return new sf(ei.Zr,this.serializer)}Wa(t){return new _f}async terminate(){var t,e;(t=this.gcScheduler)===null||t===void 0||t.stop(),(e=this.indexBackfillerScheduler)===null||e===void 0||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}wr.provider={build:()=>new wr};class Us{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>Ea(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=np.bind(null,this.syncEngine),await Lf(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return function(){return new Uf}()}createDatastore(t){const e=Or(t.databaseInfo.databaseId),r=function(o){return new vf(o)}(t.databaseInfo);return function(o,a,l,h){return new Af(o,a,l,h)}(t.authCredentials,t.appCheckCredentials,r,e)}createRemoteStore(t){return function(r,s,o,a,l){return new Pf(r,s,o,a,l)}(this.localStore,this.datastore,t.asyncQueue,e=>Ea(this.syncEngine,e,0),function(){return pa.D()?new pa:new yf}())}createSyncEngine(t,e){return function(s,o,a,l,h,f,p){const E=new Gf(s,o,a,l,h,f);return p&&(E.Qa=!0),E}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await async function(s){const o=F(s);O("RemoteStore","RemoteStore shutting down."),o.L_.add(5),await Dn(o),o.k_.shutdown(),o.q_.set("Unknown")}(this.remoteStore),(t=this.datastore)===null||t===void 0||t.terminate(),(e=this.eventManager)===null||e===void 0||e.terminate()}}Us.provider={build:()=>new Us};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pi{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ya(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ya(this.observer.error,t):Gt("Uncaught Error in snapshot listener:",t.toString()))}Za(){this.muted=!0}Ya(t,e){setTimeout(()=>{this.muted||t(e)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ip{constructor(t,e,r,s,o){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=r,this.databaseInfo=s,this.user=yt.UNAUTHENTICATED,this.clientId=tu.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=o,this.authCredentials.start(r,async a=>{O("FirestoreClient","Received user=",a.uid),await this.authCredentialListener(a),this.user=a}),this.appCheckCredentials.start(r,a=>(O("FirestoreClient","Received new app check token=",a),this.appCheckCredentialListener(a,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new $t;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const r=ui(e,"Failed to shutdown persistence");t.reject(r)}}),t.promise}}async function _s(n,t){n.asyncQueue.verifyOperationInProgress(),O("FirestoreClient","Initializing OfflineComponentProvider");const e=n.configuration;await t.initialize(e);let r=e.initialUser;n.setCredentialChangeListener(async s=>{r.isEqual(s)||(await Nu(t.localStore,s),r=s)}),t.persistence.setDatabaseDeletedListener(()=>n.terminate()),n._offlineComponents=t}async function va(n,t){n.asyncQueue.verifyOperationInProgress();const e=await op(n);O("FirestoreClient","Initializing OnlineComponentProvider"),await t.initialize(e,n.configuration),n.setCredentialChangeListener(r=>ma(t.remoteStore,r)),n.setAppCheckTokenChangeListener((r,s)=>ma(t.remoteStore,s)),n._onlineComponents=t}async function op(n){if(!n._offlineComponents)if(n._uninitializedComponentsProvider){O("FirestoreClient","Using user provided OfflineComponentProvider");try{await _s(n,n._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!function(s){return s.name==="FirebaseError"?s.code===b.FAILED_PRECONDITION||s.code===b.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11}(e))throw e;ke("Error using user provided cache. Falling back to memory cache: "+e),await _s(n,new wr)}}else O("FirestoreClient","Using default OfflineComponentProvider"),await _s(n,new wr);return n._offlineComponents}async function Yu(n){return n._onlineComponents||(n._uninitializedComponentsProvider?(O("FirestoreClient","Using user provided OnlineComponentProvider"),await va(n,n._uninitializedComponentsProvider._online)):(O("FirestoreClient","Using default OnlineComponentProvider"),await va(n,new Us))),n._onlineComponents}function ap(n){return Yu(n).then(t=>t.syncEngine)}async function Ir(n){const t=await Yu(n),e=t.eventManager;return e.onListen=Hf.bind(null,t.syncEngine),e.onUnlisten=Qf.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=Kf.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=Xf.bind(null,t.syncEngine),e}function up(n,t,e={}){const r=new $t;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,l,h,f){const p=new pi({next:I=>{p.Za(),a.enqueueAndForget(()=>ci(o,E));const P=I.docs.has(l);!P&&I.fromCache?f.reject(new k(b.UNAVAILABLE,"Failed to get document because the client is offline.")):P&&I.fromCache&&h&&h.source==="server"?f.reject(new k(b.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):f.resolve(I)},error:I=>f.reject(I)}),E=new di(br(l.path),p,{includeMetadataChanges:!0,_a:!0});return li(o,E)}(await Ir(n),n.asyncQueue,t,e,r)),r.promise}function lp(n,t,e={}){const r=new $t;return n.asyncQueue.enqueueAndForget(async()=>function(o,a,l,h,f){const p=new pi({next:I=>{p.Za(),a.enqueueAndForget(()=>ci(o,E)),I.fromCache&&h.source==="server"?f.reject(new k(b.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):f.resolve(I)},error:I=>f.reject(I)}),E=new di(l,p,{includeMetadataChanges:!0,_a:!0});return li(o,E)}(await Ir(n),n.asyncQueue,t,e,r)),r.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ju(n){const t={};return n.timeoutSeconds!==void 0&&(t.timeoutSeconds=n.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wa=new Map;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mi(n,t,e){if(!e)throw new k(b.INVALID_ARGUMENT,`Function ${n}() cannot be called with an empty ${t}.`)}function cp(n,t,e,r){if(t===!0&&r===!0)throw new k(b.INVALID_ARGUMENT,`${n} and ${e} cannot be used together.`)}function Ia(n){if(!x.isDocumentKey(n))throw new k(b.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${n} has ${n.length}.`)}function Aa(n){if(x.isDocumentKey(n))throw new k(b.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${n} has ${n.length}.`)}function Lr(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const t=function(r){return r.constructor?r.constructor.name:null}(n);return t?`a custom ${t} object`:"an object"}}return typeof n=="function"?"a function":M()}function Tt(n,t){if("_delegate"in n&&(n=n._delegate),!(n instanceof t)){if(t.name===n.constructor.name)throw new k(b.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=Lr(n);throw new k(b.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return n}function hp(n,t){if(t<=0)throw new k(b.INVALID_ARGUMENT,`Function ${n}() requires a positive number, but it was: ${t}.`)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ra{constructor(t){var e,r;if(t.host===void 0){if(t.ssl!==void 0)throw new k(b.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0}else this.host=t.host,this.ssl=(e=t.ssl)===null||e===void 0||e;if(this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=41943040;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<1048576)throw new k(b.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}cp("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Ju((r=t.experimentalLongPollingOptions)!==null&&r!==void 0?r:{}),function(o){if(o.timeoutSeconds!==void 0){if(isNaN(o.timeoutSeconds))throw new k(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (must not be NaN)`);if(o.timeoutSeconds<5)throw new k(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (minimum allowed value is 5)`);if(o.timeoutSeconds>30)throw new k(b.INVALID_ARGUMENT,`invalid long polling timeout: ${o.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&function(r,s){return r.timeoutSeconds===s.timeoutSeconds}(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class Nn{constructor(t,e,r,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=r,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Ra({}),this._settingsFrozen=!1,this._terminateTask="notTerminated"}get app(){if(!this._app)throw new k(b.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new k(b.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Ra(t),t.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new Ph;switch(r.type){case"firstParty":return new Vh(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new k(b.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials))}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const r=wa.get(e);r&&(O("ComponentProvider","Removing Datastore"),wa.delete(e),r.terminate())}(this),Promise.resolve()}}function dp(n,t,e,r={}){var s;const o=(n=Tt(n,Nn))._getSettings(),a=`${t}:${e}`;if(o.host!=="firestore.googleapis.com"&&o.host!==a&&ke("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used."),n._setSettings(Object.assign(Object.assign({},o),{host:a,ssl:!1})),r.mockUserToken){let l,h;if(typeof r.mockUserToken=="string")l=r.mockUserToken,h=yt.MOCK_USER;else{l=Ua(r.mockUserToken,(s=n._app)===null||s===void 0?void 0:s.options.projectId);const f=r.mockUserToken.sub||r.mockUserToken.user_id;if(!f)throw new k(b.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");h=new yt(f)}n._authCredentials=new bh(new Za(l,h))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(t,e,r){this.converter=e,this._query=r,this.type="query",this.firestore=t}withConverter(t){return new Ut(this.firestore,t,this._query)}}class vt{constructor(t,e,r){this.converter=e,this._key=r,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new te(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new vt(this.firestore,t,this._key)}}class te extends Ut{constructor(t,e,r){super(t,e,br(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new vt(this.firestore,null,new x(t))}withConverter(t){return new te(this.firestore,t,this._path)}}function Ym(n,t,...e){if(n=wt(n),mi("collection","path",t),n instanceof Nn){const r=X.fromString(t,...e);return Aa(r),new te(n,null,r)}{if(!(n instanceof vt||n instanceof te))throw new k(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(t,...e));return Aa(r),new te(n.firestore,null,r)}}function Jm(n,t){if(n=Tt(n,Nn),mi("collectionGroup","collection id",t),t.indexOf("/")>=0)throw new k(b.INVALID_ARGUMENT,`Invalid collection ID '${t}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Ut(n,null,function(r){return new Te(X.emptyPath(),r)}(t))}function fp(n,t,...e){if(n=wt(n),arguments.length===1&&(t=tu.newId()),mi("doc","path",t),n instanceof Nn){const r=X.fromString(t,...e);return Ia(r),new vt(n,null,new x(r))}{if(!(n instanceof vt||n instanceof te))throw new k(b.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=n._path.child(X.fromString(t,...e));return Ia(r),new vt(n.firestore,n instanceof te?n.converter:null,new x(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pa{constructor(t=Promise.resolve()){this.Pu=[],this.Iu=!1,this.Tu=[],this.Eu=null,this.du=!1,this.Au=!1,this.Ru=[],this.t_=new xu(this,"async_queue_retry"),this.Vu=()=>{const r=gs();r&&O("AsyncQueue","Visibility state changed to "+r.visibilityState),this.t_.jo()},this.mu=t;const e=gs();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this.Vu)}get isShuttingDown(){return this.Iu}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.fu(),this.gu(t)}enterRestrictedMode(t){if(!this.Iu){this.Iu=!0,this.Au=t||!1;const e=gs();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this.Vu)}}enqueue(t){if(this.fu(),this.Iu)return new Promise(()=>{});const e=new $t;return this.gu(()=>this.Iu&&this.Au?Promise.resolve():(t().then(e.resolve,e.reject),e.promise)).then(()=>e.promise)}enqueueRetryable(t){this.enqueueAndForget(()=>(this.Pu.push(t),this.pu()))}async pu(){if(this.Pu.length!==0){try{await this.Pu[0](),this.Pu.shift(),this.t_.reset()}catch(t){if(!Cn(t))throw t;O("AsyncQueue","Operation failed with retryable error: "+t)}this.Pu.length>0&&this.t_.Go(()=>this.pu())}}gu(t){const e=this.mu.then(()=>(this.du=!0,t().catch(r=>{this.Eu=r,this.du=!1;const s=function(a){let l=a.message||"";return a.stack&&(l=a.stack.includes(a.message)?a.stack:a.message+`
`+a.stack),l}(r);throw Gt("INTERNAL UNHANDLED ERROR: ",s),r}).then(r=>(this.du=!1,r))));return this.mu=e,e}enqueueAfterDelay(t,e,r){this.fu(),this.Ru.indexOf(t)>-1&&(e=0);const s=ai.createAndSchedule(this,t,e,r,o=>this.yu(o));return this.Tu.push(s),s}fu(){this.Eu&&M()}verifyOperationInProgress(){}async wu(){let t;do t=this.mu,await t;while(t!==this.mu)}Su(t){for(const e of this.Tu)if(e.timerId===t)return!0;return!1}bu(t){return this.wu().then(()=>{this.Tu.sort((e,r)=>e.targetTimeMs-r.targetTimeMs);for(const e of this.Tu)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.wu()})}Du(t){this.Ru.push(t)}yu(t){const e=this.Tu.indexOf(t);this.Tu.splice(e,1)}}function ba(n){return function(e,r){if(typeof e!="object"||e===null)return!1;const s=e;for(const o of r)if(o in s&&typeof s[o]=="function")return!0;return!1}(n,["next","error","complete"])}class Ft extends Nn{constructor(t,e,r,s){super(t,e,r,s),this.type="firestore",this._queue=new Pa,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new Pa(t),this._firestoreClient=void 0,await t}}}function Zm(n,t){const e=typeof n=="object"?n:za(),r=typeof n=="string"?n:"(default)",s=ja(e,"firestore").getImmediate({identifier:r});if(!s._initialized){const o=La("firestore");o&&dp(s,...o)}return s}function On(n){if(n._terminated)throw new k(b.FAILED_PRECONDITION,"The client has already been terminated.");return n._firestoreClient||pp(n),n._firestoreClient}function pp(n){var t,e,r;const s=n._freezeSettings(),o=function(l,h,f,p){return new $h(l,h,f,p.host,p.ssl,p.experimentalForceLongPolling,p.experimentalAutoDetectLongPolling,Ju(p.experimentalLongPollingOptions),p.useFetchStreams)}(n._databaseId,((t=n._app)===null||t===void 0?void 0:t.options.appId)||"",n._persistenceKey,s);n._componentsProvider||!((e=s.localCache)===null||e===void 0)&&e._offlineComponentProvider&&(!((r=s.localCache)===null||r===void 0)&&r._onlineComponentProvider)&&(n._componentsProvider={_offline:s.localCache._offlineComponentProvider,_online:s.localCache._onlineComponentProvider}),n._firestoreClient=new ip(n._authCredentials,n._appCheckCredentials,n._queue,o,n._componentsProvider&&function(l){const h=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(h),_online:h}}(n._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(t){this._byteString=t}static fromBase64String(t){try{return new Fe(dt.fromBase64String(t))}catch(e){throw new k(b.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new Fe(dt.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xn{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new k(b.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ct(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fr{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gi{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new k(b.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new k(b.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}toJSON(){return{latitude:this._lat,longitude:this._long}}_compareTo(t){return K(this._lat,t._lat)||K(this._long,t._long)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _i{constructor(t){this._values=(t||[]).map(e=>e)}toArray(){return this._values.map(t=>t)}isEqual(t){return function(r,s){if(r.length!==s.length)return!1;for(let o=0;o<r.length;++o)if(r[o]!==s[o])return!1;return!0}(this._values,t._values)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mp=/^__.*__$/;class gp{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return this.fieldMask!==null?new se(t,this.data,this.fieldMask,e,this.fieldTransforms):new Sn(t,this.data,e,this.fieldTransforms)}}class Zu{constructor(t,e,r){this.data=t,this.fieldMask=e,this.fieldTransforms=r}toMutation(t,e){return new se(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function tl(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw M()}}class yi{constructor(t,e,r,s,o,a){this.settings=t,this.databaseId=e,this.serializer=r,this.ignoreUndefinedProperties=s,o===void 0&&this.vu(),this.fieldTransforms=o||[],this.fieldMask=a||[]}get path(){return this.settings.path}get Cu(){return this.settings.Cu}Fu(t){return new yi(Object.assign(Object.assign({},this.settings),t),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}Mu(t){var e;const r=(e=this.path)===null||e===void 0?void 0:e.child(t),s=this.Fu({path:r,xu:!1});return s.Ou(t),s}Nu(t){var e;const r=(e=this.path)===null||e===void 0?void 0:e.child(t),s=this.Fu({path:r,xu:!1});return s.vu(),s}Lu(t){return this.Fu({path:void 0,xu:!0})}Bu(t){return Ar(t,this.settings.methodName,this.settings.ku||!1,this.path,this.settings.qu)}contains(t){return this.fieldMask.find(e=>t.isPrefixOf(e))!==void 0||this.fieldTransforms.find(e=>t.isPrefixOf(e.field))!==void 0}vu(){if(this.path)for(let t=0;t<this.path.length;t++)this.Ou(this.path.get(t))}Ou(t){if(t.length===0)throw this.Bu("Document fields must not be empty");if(tl(this.Cu)&&mp.test(t))throw this.Bu('Document fields cannot begin and end with "__"')}}class _p{constructor(t,e,r){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=r||Or(t)}Qu(t,e,r,s=!1){return new yi({Cu:t,methodName:e,qu:r,path:ct.emptyPath(),xu:!1,ku:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Mn(n){const t=n._freezeSettings(),e=Or(n._databaseId);return new _p(n._databaseId,!!t.ignoreUndefinedProperties,e)}function Ei(n,t,e,r,s,o={}){const a=n.Qu(o.merge||o.mergeFields?2:0,t,e,s);vi("Data must be an object, but it was:",a,r);const l=rl(r,a);let h,f;if(o.merge)h=new Vt(a.fieldMask),f=a.fieldTransforms;else if(o.mergeFields){const p=[];for(const E of o.mergeFields){const I=Bs(t,E,e);if(!a.contains(I))throw new k(b.INVALID_ARGUMENT,`Field '${I}' is specified in your field mask but missing from your input data.`);il(p,I)||p.push(I)}h=new Vt(p),f=a.fieldTransforms.filter(E=>h.covers(E.field))}else h=null,f=a.fieldTransforms;return new gp(new Ct(l),h,f)}class Ur extends Fr{_toFieldTransform(t){if(t.Cu!==2)throw t.Cu===1?t.Bu(`${this._methodName}() can only appear at the top level of your update data`):t.Bu(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof Ur}}class Ti extends Fr{_toFieldTransform(t){return new pd(t.path,new An)}isEqual(t){return t instanceof Ti}}function el(n,t,e,r){const s=n.Qu(1,t,e);vi("Data must be an object, but it was:",s,r);const o=[],a=Ct.empty();Ee(r,(h,f)=>{const p=wi(t,h,e);f=wt(f);const E=s.Nu(p);if(f instanceof Ur)o.push(p);else{const I=Ln(f,E);I!=null&&(o.push(p),a.set(p,I))}});const l=new Vt(o);return new Zu(a,l,s.fieldTransforms)}function nl(n,t,e,r,s,o){const a=n.Qu(1,t,e),l=[Bs(t,r,e)],h=[s];if(o.length%2!=0)throw new k(b.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let I=0;I<o.length;I+=2)l.push(Bs(t,o[I])),h.push(o[I+1]);const f=[],p=Ct.empty();for(let I=l.length-1;I>=0;--I)if(!il(f,l[I])){const P=l[I];let V=h[I];V=wt(V);const N=a.Nu(P);if(V instanceof Ur)f.push(P);else{const S=Ln(V,N);S!=null&&(f.push(P),p.set(P,S))}}const E=new Vt(f);return new Zu(p,E,a.fieldTransforms)}function yp(n,t,e,r=!1){return Ln(e,n.Qu(r?4:3,t))}function Ln(n,t){if(sl(n=wt(n)))return vi("Unsupported field value:",t,n),rl(n,t);if(n instanceof Fr)return function(r,s){if(!tl(s.Cu))throw s.Bu(`${r._methodName}() can only be used with update() and set()`);if(!s.path)throw s.Bu(`${r._methodName}() is not currently supported inside arrays`);const o=r._toFieldTransform(s);o&&s.fieldTransforms.push(o)}(n,t),null;if(n===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),n instanceof Array){if(t.settings.xu&&t.Cu!==4)throw t.Bu("Nested arrays are not supported");return function(r,s){const o=[];let a=0;for(const l of r){let h=Ln(l,s.Lu(a));h==null&&(h={nullValue:"NULL_VALUE"}),o.push(h),a++}return{arrayValue:{values:o}}}(n,t)}return function(r,s){if((r=wt(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return hd(s.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const o=ot.fromDate(r);return{timestampValue:Tr(s.serializer,o)}}if(r instanceof ot){const o=new ot(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:Tr(s.serializer,o)}}if(r instanceof gi)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof Fe)return{bytesValue:Pu(s.serializer,r._byteString)};if(r instanceof vt){const o=s.databaseId,a=r.firestore._databaseId;if(!a.isEqual(o))throw s.Bu(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${o.projectId}/${o.database}`);return{referenceValue:Zs(r.firestore._databaseId||s.databaseId,r._key.path)}}if(r instanceof _i)return function(a,l){return{mapValue:{fields:{__type__:{stringValue:"__vector__"},value:{arrayValue:{values:a.toArray().map(h=>{if(typeof h!="number")throw l.Bu("VectorValues must only contain numeric values.");return Xs(l.serializer,h)})}}}}}}(r,s);throw s.Bu(`Unsupported field value: ${Lr(r)}`)}(n,t)}function rl(n,t){const e={};return eu(n)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):Ee(n,(r,s)=>{const o=Ln(s,t.Mu(r));o!=null&&(e[r]=o)}),{mapValue:{fields:e}}}function sl(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof ot||n instanceof gi||n instanceof Fe||n instanceof vt||n instanceof Fr||n instanceof _i)}function vi(n,t,e){if(!sl(e)||!function(s){return typeof s=="object"&&s!==null&&(Object.getPrototypeOf(s)===Object.prototype||Object.getPrototypeOf(s)===null)}(e)){const r=Lr(e);throw r==="an object"?t.Bu(n+" a custom object"):t.Bu(n+" "+r)}}function Bs(n,t,e){if((t=wt(t))instanceof xn)return t._internalPath;if(typeof t=="string")return wi(n,t);throw Ar("Field path arguments must be of type string or ",n,!1,void 0,e)}const Ep=new RegExp("[~\\*/\\[\\]]");function wi(n,t,e){if(t.search(Ep)>=0)throw Ar(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,n,!1,void 0,e);try{return new xn(...t.split("."))._internalPath}catch{throw Ar(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n,!1,void 0,e)}}function Ar(n,t,e,r,s){const o=r&&!r.isEmpty(),a=s!==void 0;let l=`Function ${t}() called with invalid data`;e&&(l+=" (via `toFirestore()`)"),l+=". ";let h="";return(o||a)&&(h+=" (found",o&&(h+=` in field ${r}`),a&&(h+=` in document ${s}`),h+=")"),new k(b.INVALID_ARGUMENT,l+n+h)}function il(n,t){return n.some(e=>e.isEqual(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ol{constructor(t,e,r,s,o){this._firestore=t,this._userDataWriter=e,this._key=r,this._document=s,this._converter=o}get id(){return this._key.path.lastSegment()}get ref(){return new vt(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Tp(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(Br("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Tp extends ol{data(){return super.data()}}function Br(n,t){return typeof t=="string"?wi(n,t):t instanceof xn?t._internalPath:t._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function al(n){if(n.limitType==="L"&&n.explicitOrderBy.length===0)throw new k(b.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Ii{}class Ai extends Ii{}function tg(n,t,...e){let r=[];t instanceof Ii&&r.push(t),r=r.concat(e),function(o){const a=o.filter(h=>h instanceof Ri).length,l=o.filter(h=>h instanceof qr).length;if(a>1||a>0&&l>0)throw new k(b.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const s of r)n=s._apply(n);return n}class qr extends Ai{constructor(t,e,r){super(),this._field=t,this._op=e,this._value=r,this.type="where"}static _create(t,e,r){return new qr(t,e,r)}_apply(t){const e=this._parse(t);return ul(t._query,e),new Ut(t.firestore,t.converter,Ds(t._query,e))}_parse(t){const e=Mn(t.firestore);return function(o,a,l,h,f,p,E){let I;if(f.isKeyField()){if(p==="array-contains"||p==="array-contains-any")throw new k(b.INVALID_ARGUMENT,`Invalid Query. You can't perform '${p}' queries on documentId().`);if(p==="in"||p==="not-in"){Sa(E,p);const P=[];for(const V of E)P.push(Ca(h,o,V));I={arrayValue:{values:P}}}else I=Ca(h,o,E)}else p!=="in"&&p!=="not-in"&&p!=="array-contains-any"||Sa(E,p),I=yp(l,a,E,p==="in"||p==="not-in");return it.create(f,p,I)}(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}function eg(n,t,e){const r=t,s=Br("where",n);return qr._create(s,r,e)}class Ri extends Ii{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new Ri(t,e)}_parse(t){const e=this._queryConstraints.map(r=>r._parse(t)).filter(r=>r.getFilters().length>0);return e.length===1?e[0]:Nt.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:(function(s,o){let a=s;const l=o.getFlattenedFilters();for(const h of l)ul(a,h),a=Ds(a,h)}(t._query,e),new Ut(t.firestore,t.converter,Ds(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Pi extends Ai{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new Pi(t,e)}_apply(t){const e=function(s,o,a){if(s.startAt!==null)throw new k(b.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new k(b.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new In(o,a)}(t._query,this._field,this._direction);return new Ut(t.firestore,t.converter,function(s,o){const a=s.explicitOrderBy.concat([o]);return new Te(s.path,s.collectionGroup,a,s.filters.slice(),s.limit,s.limitType,s.startAt,s.endAt)}(t._query,e))}}function ng(n,t="asc"){const e=t,r=Br("orderBy",n);return Pi._create(r,e)}class bi extends Ai{constructor(t,e,r){super(),this.type=t,this._limit=e,this._limitType=r}static _create(t,e,r){return new bi(t,e,r)}_apply(t){return new Ut(t.firestore,t.converter,yr(t._query,this._limit,this._limitType))}}function rg(n){return hp("limit",n),bi._create("limit",n,"F")}function Ca(n,t,e){if(typeof(e=wt(e))=="string"){if(e==="")throw new k(b.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!cu(t)&&e.indexOf("/")!==-1)throw new k(b.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const r=t.path.child(X.fromString(e));if(!x.isDocumentKey(r))throw new k(b.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Qo(n,new x(r))}if(e instanceof vt)return Qo(n,e._key);throw new k(b.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Lr(e)}.`)}function Sa(n,t){if(!Array.isArray(n)||n.length===0)throw new k(b.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function ul(n,t){const e=function(s,o){for(const a of s)for(const l of a.getFlattenedFilters())if(o.indexOf(l.op)>=0)return l.op;return null}(n.filters,function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(t.op));if(e!==null)throw e===t.op?new k(b.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new k(b.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}class vp{convertValue(t,e="none"){switch(ge(t)){case 0:return null;case 1:return t.booleanValue;case 2:return rt(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(me(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw M()}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const r={};return Ee(t,(s,o)=>{r[s]=this.convertValue(o,e)}),r}convertVectorValue(t){var e,r,s;const o=(s=(r=(e=t.fields)===null||e===void 0?void 0:e.value.arrayValue)===null||r===void 0?void 0:r.values)===null||s===void 0?void 0:s.map(a=>rt(a.doubleValue));return new _i(o)}convertGeoPoint(t){return new gi(rt(t.latitude),rt(t.longitude))}convertArray(t,e){return(t.values||[]).map(r=>this.convertValue(r,e))}convertServerTimestamp(t,e){switch(e){case"previous":const r=Hs(t);return r==null?null:this.convertValue(r,e);case"estimate":return this.convertTimestamp(Tn(t));default:return null}}convertTimestamp(t){const e=ne(t);return new ot(e.seconds,e.nanos)}convertDocumentKey(t,e){const r=X.fromString(t);W(ku(r));const s=new vn(r.get(1),r.get(3)),o=new x(r.popFirst(5));return s.isEqual(e)||Gt(`Document ${o} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),o}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ci(n,t,e){let r;return r=n?e&&(e.merge||e.mergeFields)?n.toFirestore(t,e):n.toFirestore(t):t,r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class ll extends ol{constructor(t,e,r,s,o,a){super(t,e,r,s,a),this._firestore=t,this._firestoreImpl=t,this.metadata=o}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new pr(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const r=this._document.data.field(Br("DocumentSnapshot.get",t));if(r!==null)return this._userDataWriter.convertValue(r,e.serverTimestamps)}}}class pr extends ll{data(t={}){return super.data(t)}}class cl{constructor(t,e,r,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new hn(s.hasPendingWrites,s.fromCache),this.query=r}get docs(){const t=[];return this.forEach(e=>t.push(e)),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach(r=>{t.call(e,new pr(this._firestore,this._userDataWriter,r.key,r,new hn(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new k(b.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(s,o){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map(l=>{const h=new pr(s._firestore,s._userDataWriter,l.doc.key,l.doc,new hn(s._snapshot.mutatedKeys.has(l.doc.key),s._snapshot.fromCache),s.query.converter);return l.doc,{type:"added",doc:h,oldIndex:-1,newIndex:a++}})}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter(l=>o||l.type!==3).map(l=>{const h=new pr(s._firestore,s._userDataWriter,l.doc.key,l.doc,new hn(s._snapshot.mutatedKeys.has(l.doc.key),s._snapshot.fromCache),s.query.converter);let f=-1,p=-1;return l.type!==0&&(f=a.indexOf(l.doc.key),a=a.delete(l.doc.key)),l.type!==1&&(a=a.add(l.doc),p=a.indexOf(l.doc.key)),{type:wp(l.type),doc:h,oldIndex:f,newIndex:p}})}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}}function wp(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return M()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sg(n){n=Tt(n,vt);const t=Tt(n.firestore,Ft);return up(On(t),n._key).then(e=>hl(t,n,e))}class Si extends vp{constructor(t){super(),this.firestore=t}convertBytes(t){return new Fe(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new vt(this.firestore,null,e)}}function ig(n){n=Tt(n,Ut);const t=Tt(n.firestore,Ft),e=On(t),r=new Si(t);return al(n._query),lp(e,n._query).then(s=>new cl(t,r,n,s))}function og(n,t,e){n=Tt(n,vt);const r=Tt(n.firestore,Ft),s=Ci(n.converter,t,e);return Fn(r,[Ei(Mn(r),"setDoc",n._key,s,n.converter!==null,e).toMutation(n._key,Pt.none())])}function ag(n,t,e,...r){n=Tt(n,vt);const s=Tt(n.firestore,Ft),o=Mn(s);let a;return a=typeof(t=wt(t))=="string"||t instanceof xn?nl(o,"updateDoc",n._key,t,e,r):el(o,"updateDoc",n._key,t),Fn(s,[a.toMutation(n._key,Pt.exists(!0))])}function ug(n){return Fn(Tt(n.firestore,Ft),[new kr(n._key,Pt.none())])}function lg(n,t){const e=Tt(n.firestore,Ft),r=fp(n),s=Ci(n.converter,t);return Fn(e,[Ei(Mn(n.firestore),"addDoc",r._key,s,n.converter!==null,{}).toMutation(r._key,Pt.exists(!1))]).then(()=>r)}function cg(n,...t){var e,r,s;n=wt(n);let o={includeMetadataChanges:!1,source:"default"},a=0;typeof t[a]!="object"||ba(t[a])||(o=t[a],a++);const l={includeMetadataChanges:o.includeMetadataChanges,source:o.source};if(ba(t[a])){const E=t[a];t[a]=(e=E.next)===null||e===void 0?void 0:e.bind(E),t[a+1]=(r=E.error)===null||r===void 0?void 0:r.bind(E),t[a+2]=(s=E.complete)===null||s===void 0?void 0:s.bind(E)}let h,f,p;if(n instanceof vt)f=Tt(n.firestore,Ft),p=br(n._key.path),h={next:E=>{t[a]&&t[a](hl(f,n,E))},error:t[a+1],complete:t[a+2]};else{const E=Tt(n,Ut);f=Tt(E.firestore,Ft),p=E._query;const I=new Si(f);h={next:P=>{t[a]&&t[a](new cl(f,I,E,P))},error:t[a+1],complete:t[a+2]},al(n._query)}return function(I,P,V,N){const S=new pi(N),U=new di(P,S,V);return I.asyncQueue.enqueueAndForget(async()=>li(await Ir(I),U)),()=>{S.Za(),I.asyncQueue.enqueueAndForget(async()=>ci(await Ir(I),U))}}(On(f),p,l,h)}function Fn(n,t){return function(r,s){const o=new $t;return r.asyncQueue.enqueueAndForget(async()=>Yf(await ap(r),s,o)),o.promise}(On(n),t)}function hl(n,t,e){const r=e.docs.get(t._key),s=new Si(n);return new ll(n,s,t._key,r,new hn(e.hasPendingWrites,e.fromCache),t.converter)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ip{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=Mn(t)}set(t,e,r){this._verifyNotCommitted();const s=ys(t,this._firestore),o=Ci(s.converter,e,r),a=Ei(this._dataReader,"WriteBatch.set",s._key,o,s.converter!==null,r);return this._mutations.push(a.toMutation(s._key,Pt.none())),this}update(t,e,r,...s){this._verifyNotCommitted();const o=ys(t,this._firestore);let a;return a=typeof(e=wt(e))=="string"||e instanceof xn?nl(this._dataReader,"WriteBatch.update",o._key,e,r,s):el(this._dataReader,"WriteBatch.update",o._key,e),this._mutations.push(a.toMutation(o._key,Pt.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=ys(t,this._firestore);return this._mutations=this._mutations.concat(new kr(e._key,Pt.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new k(b.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function ys(n,t){if((n=wt(n)).firestore!==t)throw new k(b.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return n}function hg(){return new Ti("serverTimestamp")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dg(n){return On(n=Tt(n,Ft)),new Ip(n,t=>Fn(n,t))}(function(t,e=!0){(function(s){Ue=s})($a),_n(new Ve("firestore",(r,{instanceIdentifier:s,options:o})=>{const a=r.getProvider("app").getImmediate(),l=new Ft(new Ch(r.getProvider("auth-internal")),new kh(r.getProvider("app-check-internal")),function(f,p){if(!Object.prototype.hasOwnProperty.apply(f.options,["projectId"]))throw new k(b.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new vn(f.options.projectId,p)}(a,s),a);return o=Object.assign({useFetchStreams:e},o),l._setSettings(o),l},"PUBLIC").setMultipleInstances(!0)),he(zo,"4.7.3",t),he(zo,"4.7.3","esm2017")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dl="firebasestorage.googleapis.com",fl="storageBucket",Ap=2*60*1e3,Rp=10*60*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et extends ye{constructor(t,e,r=0){super(Es(t),`Firebase Storage: ${e} (${Es(t)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,et.prototype)}get status(){return this.status_}set status(t){this.status_=t}_codeEquals(t){return Es(t)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(t){this.customData.serverResponse=t,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var tt;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(tt||(tt={}));function Es(n){return"storage/"+n}function Vi(){const n="An unknown error occurred, please check the error payload for server response.";return new et(tt.UNKNOWN,n)}function Pp(n){return new et(tt.OBJECT_NOT_FOUND,"Object '"+n+"' does not exist.")}function bp(n){return new et(tt.QUOTA_EXCEEDED,"Quota for bucket '"+n+"' exceeded, please view quota on https://firebase.google.com/pricing/.")}function Cp(){const n="User is not authenticated, please authenticate using Firebase Authentication and try again.";return new et(tt.UNAUTHENTICATED,n)}function Sp(){return new et(tt.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project.")}function Vp(n){return new et(tt.UNAUTHORIZED,"User does not have permission to access '"+n+"'.")}function Dp(){return new et(tt.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function kp(){return new et(tt.CANCELED,"User canceled the upload/download.")}function Np(n){return new et(tt.INVALID_URL,"Invalid URL '"+n+"'.")}function Op(n){return new et(tt.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function xp(){return new et(tt.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+fl+"' property when initializing the app?")}function Mp(){return new et(tt.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.")}function Lp(){return new et(tt.NO_DOWNLOAD_URL,"The given file does not have any download URLs.")}function Fp(n){return new et(tt.UNSUPPORTED_ENVIRONMENT,`${n} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`)}function qs(n){return new et(tt.INVALID_ARGUMENT,n)}function pl(){return new et(tt.APP_DELETED,"The Firebase app was deleted.")}function Up(n){return new et(tt.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}function gn(n,t){return new et(tt.INVALID_FORMAT,"String does not match format '"+n+"': "+t)}function an(n){throw new et(tt.INTERNAL_ERROR,"Internal error: "+n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dt{constructor(t,e){this.bucket=t,this.path_=e}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const t=encodeURIComponent;return"/b/"+t(this.bucket)+"/o/"+t(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(t,e){let r;try{r=Dt.makeFromUrl(t,e)}catch{return new Dt(t,"")}if(r.path==="")return r;throw Op(t)}static makeFromUrl(t,e){let r=null;const s="([A-Za-z0-9.\\-_]+)";function o(z){z.path.charAt(z.path.length-1)==="/"&&(z.path_=z.path_.slice(0,-1))}const a="(/(.*))?$",l=new RegExp("^gs://"+s+a,"i"),h={bucket:1,path:3};function f(z){z.path_=decodeURIComponent(z.path)}const p="v[A-Za-z0-9_]+",E=e.replace(/[.]/g,"\\."),I="(/([^?#]*).*)?$",P=new RegExp(`^https?://${E}/${p}/b/${s}/o${I}`,"i"),V={bucket:1,path:3},N=e===dl?"(?:storage.googleapis.com|storage.cloud.google.com)":e,S="([^?#]*)",U=new RegExp(`^https?://${N}/${s}/${S}`,"i"),B=[{regex:l,indices:h,postModify:o},{regex:P,indices:V,postModify:f},{regex:U,indices:{bucket:1,path:2},postModify:f}];for(let z=0;z<B.length;z++){const bt=B[z],nt=bt.regex.exec(t);if(nt){const v=nt[bt.indices.bucket];let m=nt[bt.indices.path];m||(m=""),r=new Dt(v,m),bt.postModify(r);break}}if(r==null)throw Np(t);return r}}class Bp{constructor(t){this.promise_=Promise.reject(t)}getPromise(){return this.promise_}cancel(t=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qp(n,t,e){let r=1,s=null,o=null,a=!1,l=0;function h(){return l===2}let f=!1;function p(...S){f||(f=!0,t.apply(null,S))}function E(S){s=setTimeout(()=>{s=null,n(P,h())},S)}function I(){o&&clearTimeout(o)}function P(S,...U){if(f){I();return}if(S){I(),p.call(null,S,...U);return}if(h()||a){I(),p.call(null,S,...U);return}r<64&&(r*=2);let B;l===1?(l=2,B=0):B=(r+Math.random())*1e3,E(B)}let V=!1;function N(S){V||(V=!0,I(),!f&&(s!==null?(S||(l=2),clearTimeout(s),E(0)):S||(l=1)))}return E(0),o=setTimeout(()=>{a=!0,N(!0)},e),N}function jp(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $p(n){return n!==void 0}function zp(n){return typeof n=="object"&&!Array.isArray(n)}function Di(n){return typeof n=="string"||n instanceof String}function Va(n){return ki()&&n instanceof Blob}function ki(){return typeof Blob<"u"}function Da(n,t,e,r){if(r<t)throw qs(`Invalid value for '${n}'. Expected ${t} or greater.`);if(r>e)throw qs(`Invalid value for '${n}'. Expected ${e} or less.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ni(n,t,e){let r=t;return e==null&&(r=`https://${t}`),`${e}://${r}/v0${n}`}function ml(n){const t=encodeURIComponent;let e="?";for(const r in n)if(n.hasOwnProperty(r)){const s=t(r)+"="+t(n[r]);e=e+s+"&"}return e=e.slice(0,-1),e}var fe;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(fe||(fe={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gp(n,t){const e=n>=500&&n<600,s=[408,429].indexOf(n)!==-1,o=t.indexOf(n)!==-1;return e||s||o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hp{constructor(t,e,r,s,o,a,l,h,f,p,E,I=!0){this.url_=t,this.method_=e,this.headers_=r,this.body_=s,this.successCodes_=o,this.additionalRetryCodes_=a,this.callback_=l,this.errorCallback_=h,this.timeout_=f,this.progressCallback_=p,this.connectionFactory_=E,this.retry=I,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((P,V)=>{this.resolve_=P,this.reject_=V,this.start_()})}start_(){const t=(r,s)=>{if(s){r(!1,new ur(!1,null,!0));return}const o=this.connectionFactory_();this.pendingConnection_=o;const a=l=>{const h=l.loaded,f=l.lengthComputable?l.total:-1;this.progressCallback_!==null&&this.progressCallback_(h,f)};this.progressCallback_!==null&&o.addUploadProgressListener(a),o.send(this.url_,this.method_,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&o.removeUploadProgressListener(a),this.pendingConnection_=null;const l=o.getErrorCode()===fe.NO_ERROR,h=o.getStatus();if(!l||Gp(h,this.additionalRetryCodes_)&&this.retry){const p=o.getErrorCode()===fe.ABORT;r(!1,new ur(!1,null,p));return}const f=this.successCodes_.indexOf(h)!==-1;r(!0,new ur(f,o))})},e=(r,s)=>{const o=this.resolve_,a=this.reject_,l=s.connection;if(s.wasSuccessCode)try{const h=this.callback_(l,l.getResponse());$p(h)?o(h):o()}catch(h){a(h)}else if(l!==null){const h=Vi();h.serverResponse=l.getErrorText(),this.errorCallback_?a(this.errorCallback_(l,h)):a(h)}else if(s.canceled){const h=this.appDelete_?pl():kp();a(h)}else{const h=Dp();a(h)}};this.canceled_?e(!1,new ur(!1,null,!0)):this.backoffId_=qp(t,e,this.timeout_)}getPromise(){return this.promise_}cancel(t){this.canceled_=!0,this.appDelete_=t||!1,this.backoffId_!==null&&jp(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class ur{constructor(t,e,r){this.wasSuccessCode=t,this.connection=e,this.canceled=!!r}}function Kp(n,t){t!==null&&t.length>0&&(n.Authorization="Firebase "+t)}function Wp(n,t){n["X-Firebase-Storage-Version"]="webjs/"+(t??"AppManager")}function Qp(n,t){t&&(n["X-Firebase-GMPID"]=t)}function Xp(n,t){t!==null&&(n["X-Firebase-AppCheck"]=t)}function Yp(n,t,e,r,s,o,a=!0){const l=ml(n.urlParams),h=n.url+l,f=Object.assign({},n.headers);return Qp(f,t),Kp(f,e),Wp(f,o),Xp(f,r),new Hp(h,n.method,f,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,s,a)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jp(){return typeof BlobBuilder<"u"?BlobBuilder:typeof WebKitBlobBuilder<"u"?WebKitBlobBuilder:void 0}function Zp(...n){const t=Jp();if(t!==void 0){const e=new t;for(let r=0;r<n.length;r++)e.append(n[r]);return e.getBlob()}else{if(ki())return new Blob(n);throw new et(tt.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}}function tm(n,t,e){return n.webkitSlice?n.webkitSlice(t,e):n.mozSlice?n.mozSlice(t,e):n.slice?n.slice(t,e):null}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function em(n){if(typeof atob>"u")throw Fp("base-64");return atob(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ot={RAW:"raw",BASE64:"base64",BASE64URL:"base64url",DATA_URL:"data_url"};class Ts{constructor(t,e){this.data=t,this.contentType=e||null}}function nm(n,t){switch(n){case Ot.RAW:return new Ts(gl(t));case Ot.BASE64:case Ot.BASE64URL:return new Ts(_l(n,t));case Ot.DATA_URL:return new Ts(sm(t),im(t))}throw Vi()}function gl(n){const t=[];for(let e=0;e<n.length;e++){let r=n.charCodeAt(e);if(r<=127)t.push(r);else if(r<=2047)t.push(192|r>>6,128|r&63);else if((r&64512)===55296)if(!(e<n.length-1&&(n.charCodeAt(e+1)&64512)===56320))t.push(239,191,189);else{const o=r,a=n.charCodeAt(++e);r=65536|(o&1023)<<10|a&1023,t.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|r&63)}else(r&64512)===56320?t.push(239,191,189):t.push(224|r>>12,128|r>>6&63,128|r&63)}return new Uint8Array(t)}function rm(n){let t;try{t=decodeURIComponent(n)}catch{throw gn(Ot.DATA_URL,"Malformed data URL.")}return gl(t)}function _l(n,t){switch(n){case Ot.BASE64:{const s=t.indexOf("-")!==-1,o=t.indexOf("_")!==-1;if(s||o)throw gn(n,"Invalid character '"+(s?"-":"_")+"' found: is it base64url encoded?");break}case Ot.BASE64URL:{const s=t.indexOf("+")!==-1,o=t.indexOf("/")!==-1;if(s||o)throw gn(n,"Invalid character '"+(s?"+":"/")+"' found: is it base64 encoded?");t=t.replace(/-/g,"+").replace(/_/g,"/");break}}let e;try{e=em(t)}catch(s){throw s.message.includes("polyfill")?s:gn(n,"Invalid character found")}const r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}class yl{constructor(t){this.base64=!1,this.contentType=null;const e=t.match(/^data:([^,]+)?,/);if(e===null)throw gn(Ot.DATA_URL,"Must be formatted 'data:[<mediatype>][;base64],<data>");const r=e[1]||null;r!=null&&(this.base64=om(r,";base64"),this.contentType=this.base64?r.substring(0,r.length-7):r),this.rest=t.substring(t.indexOf(",")+1)}}function sm(n){const t=new yl(n);return t.base64?_l(Ot.BASE64,t.rest):rm(t.rest)}function im(n){return new yl(n).contentType}function om(n,t){return n.length>=t.length?n.substring(n.length-t.length)===t:!1}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(t,e){let r=0,s="";Va(t)?(this.data_=t,r=t.size,s=t.type):t instanceof ArrayBuffer?(e?this.data_=new Uint8Array(t):(this.data_=new Uint8Array(t.byteLength),this.data_.set(new Uint8Array(t))),r=this.data_.length):t instanceof Uint8Array&&(e?this.data_=t:(this.data_=new Uint8Array(t.length),this.data_.set(t)),r=t.length),this.size_=r,this.type_=s}size(){return this.size_}type(){return this.type_}slice(t,e){if(Va(this.data_)){const r=this.data_,s=tm(r,t,e);return s===null?null:new Yt(s)}else{const r=new Uint8Array(this.data_.buffer,t,e-t);return new Yt(r,!0)}}static getBlob(...t){if(ki()){const e=t.map(r=>r instanceof Yt?r.data_:r);return new Yt(Zp.apply(null,e))}else{const e=t.map(a=>Di(a)?nm(Ot.RAW,a).data:a.data_);let r=0;e.forEach(a=>{r+=a.byteLength});const s=new Uint8Array(r);let o=0;return e.forEach(a=>{for(let l=0;l<a.length;l++)s[o++]=a[l]}),new Yt(s,!0)}}uploadData(){return this.data_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function El(n){let t;try{t=JSON.parse(n)}catch{return null}return zp(t)?t:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function am(n){if(n.length===0)return null;const t=n.lastIndexOf("/");return t===-1?"":n.slice(0,t)}function um(n,t){const e=t.split("/").filter(r=>r.length>0).join("/");return n.length===0?e:n+"/"+e}function Tl(n){const t=n.lastIndexOf("/",n.length-2);return t===-1?n:n.slice(t+1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lm(n,t){return t}class Rt{constructor(t,e,r,s){this.server=t,this.local=e||t,this.writable=!!r,this.xform=s||lm}}let lr=null;function cm(n){return!Di(n)||n.length<2?n:Tl(n)}function vl(){if(lr)return lr;const n=[];n.push(new Rt("bucket")),n.push(new Rt("generation")),n.push(new Rt("metageneration")),n.push(new Rt("name","fullPath",!0));function t(o,a){return cm(a)}const e=new Rt("name");e.xform=t,n.push(e);function r(o,a){return a!==void 0?Number(a):a}const s=new Rt("size");return s.xform=r,n.push(s),n.push(new Rt("timeCreated")),n.push(new Rt("updated")),n.push(new Rt("md5Hash",null,!0)),n.push(new Rt("cacheControl",null,!0)),n.push(new Rt("contentDisposition",null,!0)),n.push(new Rt("contentEncoding",null,!0)),n.push(new Rt("contentLanguage",null,!0)),n.push(new Rt("contentType",null,!0)),n.push(new Rt("metadata","customMetadata",!0)),lr=n,lr}function hm(n,t){function e(){const r=n.bucket,s=n.fullPath,o=new Dt(r,s);return t._makeStorageReference(o)}Object.defineProperty(n,"ref",{get:e})}function dm(n,t,e){const r={};r.type="file";const s=e.length;for(let o=0;o<s;o++){const a=e[o];r[a.local]=a.xform(r,t[a.server])}return hm(r,n),r}function wl(n,t,e){const r=El(t);return r===null?null:dm(n,r,e)}function fm(n,t,e,r){const s=El(t);if(s===null||!Di(s.downloadTokens))return null;const o=s.downloadTokens;if(o.length===0)return null;const a=encodeURIComponent;return o.split(",").map(f=>{const p=n.bucket,E=n.fullPath,I="/b/"+a(p)+"/o/"+a(E),P=Ni(I,e,r),V=ml({alt:"media",token:f});return P+V})[0]}function pm(n,t){const e={},r=t.length;for(let s=0;s<r;s++){const o=t[s];o.writable&&(e[o.server]=n[o.local])}return JSON.stringify(e)}class Il{constructor(t,e,r,s){this.url=t,this.method=e,this.handler=r,this.timeout=s,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Al(n){if(!n)throw Vi()}function mm(n,t){function e(r,s){const o=wl(n,s,t);return Al(o!==null),o}return e}function gm(n,t){function e(r,s){const o=wl(n,s,t);return Al(o!==null),fm(o,s,n.host,n._protocol)}return e}function Rl(n){function t(e,r){let s;return e.getStatus()===401?e.getErrorText().includes("Firebase App Check token is invalid")?s=Sp():s=Cp():e.getStatus()===402?s=bp(n.bucket):e.getStatus()===403?s=Vp(n.path):s=r,s.status=e.getStatus(),s.serverResponse=r.serverResponse,s}return t}function _m(n){const t=Rl(n);function e(r,s){let o=t(r,s);return r.getStatus()===404&&(o=Pp(n.path)),o.serverResponse=s.serverResponse,o}return e}function ym(n,t,e){const r=t.fullServerUrl(),s=Ni(r,n.host,n._protocol),o="GET",a=n.maxOperationRetryTime,l=new Il(s,o,gm(n,e),a);return l.errorHandler=_m(t),l}function Em(n,t){return n&&n.contentType||t&&t.type()||"application/octet-stream"}function Tm(n,t,e){const r=Object.assign({},e);return r.fullPath=n.path,r.size=t.size(),r.contentType||(r.contentType=Em(null,t)),r}function vm(n,t,e,r,s){const o=t.bucketOnlyServerUrl(),a={"X-Goog-Upload-Protocol":"multipart"};function l(){let B="";for(let z=0;z<2;z++)B=B+Math.random().toString().slice(2);return B}const h=l();a["Content-Type"]="multipart/related; boundary="+h;const f=Tm(t,r,s),p=pm(f,e),E="--"+h+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+p+`\r
--`+h+`\r
Content-Type: `+f.contentType+`\r
\r
`,I=`\r
--`+h+"--",P=Yt.getBlob(E,r,I);if(P===null)throw Mp();const V={name:f.fullPath},N=Ni(o,n.host,n._protocol),S="POST",U=n.maxUploadRetryTime,q=new Il(N,S,mm(n,e),U);return q.urlParams=V,q.headers=a,q.body=P.uploadData(),q.errorHandler=Rl(t),q}class wm{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=fe.NO_ERROR,this.sendPromise_=new Promise(t=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=fe.ABORT,t()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=fe.NETWORK_ERROR,t()}),this.xhr_.addEventListener("load",()=>{t()})})}send(t,e,r,s){if(this.sent_)throw an("cannot .send() more than once");if(this.sent_=!0,this.xhr_.open(e,t,!0),s!==void 0)for(const o in s)s.hasOwnProperty(o)&&this.xhr_.setRequestHeader(o,s[o].toString());return r!==void 0?this.xhr_.send(r):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw an("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw an("cannot .getStatus() before sending");try{return this.xhr_.status}catch{return-1}}getResponse(){if(!this.sent_)throw an("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw an("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(t){return this.xhr_.getResponseHeader(t)}addUploadProgressListener(t){this.xhr_.upload!=null&&this.xhr_.upload.addEventListener("progress",t)}removeUploadProgressListener(t){this.xhr_.upload!=null&&this.xhr_.upload.removeEventListener("progress",t)}}class Im extends wm{initXhr(){this.xhr_.responseType="text"}}function Pl(){return new Im}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _e{constructor(t,e){this._service=t,e instanceof Dt?this._location=e:this._location=Dt.makeFromUrl(e,t.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(t,e){return new _e(t,e)}get root(){const t=new Dt(this._location.bucket,"");return this._newRef(this._service,t)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Tl(this._location.path)}get storage(){return this._service}get parent(){const t=am(this._location.path);if(t===null)return null;const e=new Dt(this._location.bucket,t);return new _e(this._service,e)}_throwIfRoot(t){if(this._location.path==="")throw Up(t)}}function Am(n,t,e){n._throwIfRoot("uploadBytes");const r=vm(n.storage,n._location,vl(),new Yt(t,!0),e);return n.storage.makeRequestWithTokens(r,Pl).then(s=>({metadata:s,ref:n}))}function Rm(n){n._throwIfRoot("getDownloadURL");const t=ym(n.storage,n._location,vl());return n.storage.makeRequestWithTokens(t,Pl).then(e=>{if(e===null)throw Lp();return e})}function Pm(n,t){const e=um(n._location.path,t),r=new Dt(n._location.bucket,e);return new _e(n.storage,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bm(n){return/^[A-Za-z]+:\/\//.test(n)}function Cm(n,t){return new _e(n,t)}function bl(n,t){if(n instanceof Oi){const e=n;if(e._bucket==null)throw xp();const r=new _e(e,e._bucket);return t!=null?bl(r,t):r}else return t!==void 0?Pm(n,t):n}function Sm(n,t){if(t&&bm(t)){if(n instanceof Oi)return Cm(n,t);throw qs("To use ref(service, url), the first argument must be a Storage instance.")}else return bl(n,t)}function ka(n,t){const e=t==null?void 0:t[fl];return e==null?null:Dt.makeFromBucketSpec(e,n)}function Vm(n,t,e,r={}){n.host=`${t}:${e}`,n._protocol="http";const{mockUserToken:s}=r;s&&(n._overrideAuthToken=typeof s=="string"?s:Ua(s,n.app.options.projectId))}class Oi{constructor(t,e,r,s,o){this.app=t,this._authProvider=e,this._appCheckProvider=r,this._url=s,this._firebaseVersion=o,this._bucket=null,this._host=dl,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=Ap,this._maxUploadRetryTime=Rp,this._requests=new Set,s!=null?this._bucket=Dt.makeFromBucketSpec(s,this._host):this._bucket=ka(this._host,this.app.options)}get host(){return this._host}set host(t){this._host=t,this._url!=null?this._bucket=Dt.makeFromBucketSpec(this._url,t):this._bucket=ka(t,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(t){Da("time",0,Number.POSITIVE_INFINITY,t),this._maxUploadRetryTime=t}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(t){Da("time",0,Number.POSITIVE_INFINITY,t),this._maxOperationRetryTime=t}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const t=this._authProvider.getImmediate({optional:!0});if(t){const e=await t.getToken();if(e!==null)return e.accessToken}return null}async _getAppCheckToken(){const t=this._appCheckProvider.getImmediate({optional:!0});return t?(await t.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(t=>t.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(t){return new _e(this,t)}_makeRequest(t,e,r,s,o=!0){if(this._deleted)return new Bp(pl());{const a=Yp(t,this._appId,r,s,e,this._firebaseVersion,o);return this._requests.add(a),a.getPromise().then(()=>this._requests.delete(a),()=>this._requests.delete(a)),a}}async makeRequestWithTokens(t,e){const[r,s]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(t,e,r,s).getPromise()}}const Na="@firebase/storage",Oa="0.13.2";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cl="storage";function fg(n,t,e){return n=wt(n),Am(n,t,e)}function pg(n){return n=wt(n),Rm(n)}function mg(n,t){return n=wt(n),Sm(n,t)}function gg(n=za(),t){n=wt(n);const r=ja(n,Cl).getImmediate({identifier:t}),s=La("storage");return s&&Dm(r,...s),r}function Dm(n,t,e,r={}){Vm(n,t,e,r)}function km(n,{instanceIdentifier:t}){const e=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),s=n.getProvider("app-check-internal");return new Oi(e,r,s,t,$a)}function Nm(){_n(new Ve(Cl,km,"PUBLIC").setMultipleInstances(!0)),he(Na,Oa,""),he(Na,Oa,"esm2017")}Nm();export{ag as A,cg as B,Ve as C,Ym as D,Ba as E,ye as F,tg as G,ng as H,Jm as I,og as J,hg as K,qa as L,ug as M,dg as N,Km as O,rg as P,eg as Q,ig as R,$a as S,lg as T,mg as U,fg as V,pg as W,_n as _,Um as a,Fm as b,Hm as c,wt as d,js as e,Gm as f,xm as g,G as h,Mm as i,pc as j,za as k,ja as l,Ec as m,vs as n,Bm as o,qm as p,jm as q,he as r,$m as s,zm as t,Lm as u,gh as v,Zm as w,gg as x,fp as y,sg as z};
