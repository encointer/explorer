(this.webpackJsonpexplorer=this.webpackJsonpexplorer||[]).push([[0],{1182:function(e){e.exports=JSON.parse('{"PROVIDER_SOCKET":"wss://gesell.encointer.org"}')},1326:function(e,t,n){},1327:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),c=n(90),o=n.n(c),i=(n(582),n(27)),u=n(19),s=n.n(u),l=n(45),m=n(48),p=n(344),f=n(203),b=n(345),d=n.n(b),E=n(555),y=n(1182),h=["REACT_APP_PROVIDER_SOCKET","REACT_APP_DEVELOPMENT_KEYRING"].reduce((function(e,t){return void 0!==Object({NODE_ENV:"production",PUBLIC_URL:""})[t]&&(e[t.slice(10)]=Object({NODE_ENV:"production",PUBLIC_URL:""})[t]),e}),{}),C=Object(i.a)({},E,{},y,{},h),v=n(556),O=n.n(v).a.parse(window.location.search).rpc||C.PROVIDER_SOCKET;console.log("Connected socket: ".concat(O));var g={socket:O,types:C.CUSTOM_TYPES,keyring:null,keyringState:null,api:null,apiState:null},j=function(e,t){var n=null;switch(t.type){case"RESET_SOCKET":return n=t.payload||e.socket,Object(i.a)({},e,{socket:n,api:null,apiState:null});case"CONNECT":return Object(i.a)({},e,{api:t.payload,apiState:"CONNECTING"});case"CONNECT_SUCCESS":return Object(i.a)({},e,{apiState:"READY"});case"CONNECT_ERROR":return Object(i.a)({},e,{apiState:"ERROR"});case"SET_KEYRING":return Object(i.a)({},e,{keyring:t.payload,keyringState:"READY"});case"KEYRING_ERROR":return Object(i.a)({},e,{keyring:null,keyringState:"ERROR"});default:throw new Error("Unknown type: ".concat(t.type))}},S=r.a.createContext(),k=function(e){var t=Object(i.a)({},g);["socket","types"].forEach((function(n){t[n]="undefined"===typeof e[n]?t[n]:e[n]}));var n=Object(a.useReducer)(j,t),c=Object(m.a)(n,2),o=c[0],u=c[1];return r.a.createElement(S.Provider,{value:[o,u]},e.children)},w=function(){var e=Object(a.useContext)(S),t=Object(m.a)(e,2),n=t[0],r=t[1],c=n.api,o=n.socket,u=n.types,b=Object(a.useCallback)(Object(l.a)(s.a.mark((function e(){var t,n;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!c){e.next=2;break}return e.abrupt("return");case 2:t=new p.WsProvider(o),(n=new p.ApiPromise({provider:t,types:u})).on("connected",(function(){r({type:"CONNECT",payload:n}),n.isReady.then((function(e){return r({type:"CONNECT_SUCCESS"})}))})),n.on("ready",(function(){return r({type:"CONNECT_SUCCESS"})})),n.on("error",(function(){return r({type:"CONNECT_ERROR"})}));case 7:case"end":return e.stop()}}),e)}))),[c,o,u,r]),E=n.keyringState,y=Object(a.useCallback)(Object(l.a)(s.a.mark((function e(){var t;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!E){e.next=2;break}return e.abrupt("return");case 2:return e.prev=2,e.next=5,Object(f.web3Enable)(C.APP_NAME);case 5:return e.next=7,Object(f.web3Accounts)();case 7:t=(t=e.sent).map((function(e){var t=e.address,n=e.meta;return{address:t,meta:Object(i.a)({},n,{name:"".concat(n.name," (").concat(n.source,")")})}})),d.a.loadAll({isDevelopment:C.DEVELOPMENT_KEYRING},t),r({type:"SET_KEYRING",payload:d.a}),e.next=17;break;case 13:e.prev=13,e.t0=e.catch(2),console.error(e.t0),r({type:"KEYRING_ERROR"});case 17:case"end":return e.stop()}}),e,null,[[2,13]])}))),[E,r]);return Object(a.useEffect)((function(){b()}),[b]),Object(a.useEffect)((function(){y()}),[y]),Object(i.a)({},n,{dispatch:r})},N=n(264),I=n.n(N),T=n(265),R=n.n(T),P=(R()(I.a),n(171)),x=n(549),_=n(551),D=n(1342),A=n(1341),z=n(1337),M=n(23),q=n(110),G=n(339);function L(e){var t=w().api;return window.api=t,window.util=n(3),window.util_crypto=n(46),window.keyring=n(214),null}n(274);var B=n(1339);var U=n(1338),Y=n(120);var V=r.a.memo((function(e){return r.a.createElement(z.a,{as:U.a,animation:"overlay",direction:"left",icon:"labeled",inverted:!0,vertical:!0,visible:e.visible,width:"thin"},r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org",target:"_blank"},r.a.createElement(Y.a,{name:"book"}),"Documentation"),r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org/testnet/",target:"_blank"},r.a.createElement(Y.a,{name:"block layout"}),"Testnet"),r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org/blog/",target:"_blank"},r.a.createElement(Y.a,{name:"newspaper"}),"Blog"),r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org/faq/",target:"_blank"},r.a.createElement(Y.a,{name:"question circle"}),"FAQ"),r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org/donate/",target:"_blank"},r.a.createElement(Y.a,{name:"dollar"}),"Donate"),r.a.createElement(U.a.Item,{as:"a",href:"//encointer.org/about/",target:"_blank"},r.a.createElement(Y.a,{name:"favorite"}),"About"),r.a.createElement(U.a.Item,{as:"a",href:"//github.com/encointer/encointer-node",target:"_blank"},r.a.createElement(Y.a,{name:"github"}),"Code"))}),(function(e,t){return e.visible===t.visible})),F=n(1335),K=n(271),Z=function(e){var t=(e-Date.now())/1e3|0;return t>=0?"".concat((t/60|0).toString().padStart(2,"0"),":").concat((t%60).toString().padStart(2,"0")):"finished"};function H(e){var t=e.nextPhaseTimestamp,n=Object(a.useState)(""),c=Object(m.a)(n,2),o=c[0],i=c[1];return Object(a.useEffect)((function(){i(Z(t));var e=setInterval((function(){i(Z(t))}),1e3);return function(){return clearInterval(e)}}),[t]),r.a.createElement(r.a.Fragment,null,o)}var J=["REGISTERING","ASSIGNING","ATTESTING"],W=function(e){return r.a.createElement("div",null,r.a.createElement("div",null,"starting at:")," ",function(e){return new Date(e).toLocaleString()}(e))},Q=r.a.memo((function(e){var t=e.small,n=e.participantCount,a=e.meetupCount,c=e.attestationCount,o=e.currentPhase,i=o.phase,u=o.timestamp,s=[n,a,c];return r.a.createElement("div",{className:"encointer-map-ceremony-phase"},r.a.createElement(F.a.Group,{ordered:!0,unstackable:!0,className:[J[i],t?"small-screen":""].join(" "),size:"mini"},function(e){var n=(-1===i?[]:J).map((function(e,t){return{key:J[t],counter:s[t],active:t===i,className:"step-".concat(J[t]).toLowerCase()}})).filter((function(e,n){return!t||e.active||n===i+1||0===n&&2===i}));return t&&2===i?n.reverse():n}().map((function(e,n){return r.a.createElement(F.a,e,r.a.createElement(F.a.Content,null,r.a.createElement(F.a.Title,null,e.key," ",n<=i&&e.counter?r.a.createElement(K.a,{circular:!0,color:e.active?"green":"grey"},e.counter):null),r.a.createElement(F.a.Description,null,e.active?r.a.createElement("div",null,r.a.createElement("div",null,"time left: "),r.a.createElement(H,{nextPhaseTimestamp:u})):t||n===i+1||0===n&&2===i?W(u):null)))}))))}),(function(e,t){return t.small===e.small&&t.participantCount===e.participantCount&&t.meetupCount===e.meetupCount&&t.attestationCount===e.attestationCount&&t.currentPhase.phase===e.currentPhase.phase&&t.currentPhase.timestamp===e.currentPhase.timestamp})),$=n(1334),X=n(1331),ee=r.a.memo((function(e){var t=w().api,n=Object(a.useState)(0),c=Object(m.a)(n,2),o=c[0],i=c[1],u=e.finalized?t.derive.chain.bestNumberFinalized:t.derive.chain.bestNumber;return Object(a.useEffect)((function(){var e;return u((function(e){i(e.toNumber())})).then((function(t){e=t})).catch(console.error),function(){return e&&e()}}),[u]),r.a.createElement(r.a.Fragment,null,o)}),(function(e){return!0})),te=r.a.memo((function(e){var t=w().api.query.encointerScheduler.currentCeremonyIndex,n=Object(a.useState)(0),c=Object(m.a)(n,2),o=c[0],i=c[1];return Object(a.useEffect)((function(){var e;return t((function(e){i(e.toNumber())})).then((function(t){e=t})).catch(console.error),function(){return e&&e()}}),[t]),o?r.a.createElement(r.a.Fragment,null,r.a.createElement("span",null,"ceremony")," ",r.a.createElement("strong",null," #",o)):null}),(function(e){return!0}));function ne(e){var t=w(),n=t.apiState,c=t.api,o=Object(a.useState)({}),i=Object(m.a)(o,2),u=i[0],p=i[1],f=c&&c.rpc&&c.rpc.system,b=c&&c.query&&c.query.encointerScheduler&&c.query.encointerScheduler.currentCeremonyIndex;return Object(a.useEffect)((function(){f&&function(){var e=Object(l.a)(s.a.mark((function e(){var t,n,a,r,c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Promise.all([f.chain(),f.name(),f.version()]);case 3:t=e.sent,n=Object(m.a)(t,3),a=n[0],r=n[1],c=n[2],p({chain:a,nodeName:r,nodeVersion:c}),e.next=14;break;case 11:e.prev=11,e.t0=e.catch(0),console.error(e.t0);case 14:case"end":return e.stop()}}),e,null,[[0,11]])})));return function(){return e.apply(this,arguments)}}()()}),[f]),r.a.createElement($.a,{className:"encointer-map-node-info",style:e.style||{}},"READY"===n?r.a.createElement(r.a.Fragment,null,r.a.createElement($.a.Content,null,r.a.createElement($.a.Header,null,u.nodeName),r.a.createElement($.a.Meta,null,"".concat(u.chain||""," v").concat(u.nodeVersion))),r.a.createElement($.a.Content,{className:"blocks"},b?r.a.createElement(r.a.Fragment,null,r.a.createElement($.a.Meta,null),r.a.createElement("div",{className:"block-current"},"current block #",r.a.createElement(ee,null)),r.a.createElement("div",{className:"finalized-current"},"finalized block #",r.a.createElement(ee,{finalized:!0})),r.a.createElement("div",{className:"ceremony"},r.a.createElement(te,null))):r.a.createElement(r.a.Fragment,null,r.a.createElement("div",{className:"loading"},r.a.createElement(X.a,{active:!0,size:"medium",inline:"centered"}))))):r.a.createElement($.a.Content,{className:"loading"},"ERROR"!==n?r.a.createElement($.a.Meta,null,r.a.createElement(X.a,{active:!0,size:"small",inline:!0})," Connecting to the blockchain"):r.a.createElement($.a.Meta,null,"Error connecting to the blockchain")))}function ae(e){return r.a.createElement(ne,e)}var re=r.a.memo((function(e){var t=e.loading,n=e.onZoomIn,a=e.onZoomOut,c=e.onClick;return r.a.createElement(U.a,{className:"encointer-map-floating-widgets",stackable:!0,size:"mini",vertical:!0},r.a.createElement(U.a.Item,null,r.a.createElement(B.a,{onClick:c,loading:t,disabled:t,icon:"sidebar",className:"encoiner-menu-button"})),r.a.createElement(U.a.Item,null,r.a.createElement(B.a.Group,{vertical:!0,compact:!0,size:"small"},r.a.createElement(B.a,{icon:"plus",onClick:n}),r.a.createElement(B.a,{icon:"minus",onClick:a}))))}),(function(e,t){return e.loading===t.loading})),ce=n(1340),oe=n(1336),ie=n(1333),ue=n(206),se=n.n(ue);function le(e,t){var n=e+t;return se()(n>=8,"Bit length can't be less than 8, provided ".concat(n)),se()(n<=128,"Bit length can't be bigger than 128, provided ".concat(n)),se()(!(n&n-1),"Bit length should be power of 2, provided ".concat(n)),function(e){var a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:t;se()(e.bitLength()===n,"Bit length is not equal to "+n);var r=e.toString(2,n),c=(t>r.length?r.padStart(t,"0"):r).slice(-t,-1*(t-a)||void 0),o=c.split("").reduce((function(e,t,n){return e+="1"===t?1/Math.pow(2,n+1):0}),0),i=r.slice(0,-t),u=i?parseInt(i,2):0;return u+(e.negative?-o:o)}}le(4,4),le(8,8),le(16,16);var me=le(32,32),pe=le(64,64);function fe(e,t,n){var a=e;return t&&(a=a.map(t)),n&&(a=a.reduce(n,{})),a}function be(e,t,n,a){return de.apply(this,arguments)}function de(){return(de=Object(l.a)(s.a.mark((function e(t,n,a,r){var c;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,Promise.all(n.map((function(e){return t(e)})));case 2:return c=e.sent,e.abrupt("return",fe(c,a,r));case 4:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var Ee=R()(I.a);function ye(e){var t=e.debug,n=e.onClose,c=e.onShow,o=e.hash,i=e.direction,u=e.width,s=e.participantCount,l=e.lastParticipantCount,p=e.lastMeetupCount,f=e.meetupCount,b=e.data,d=b.name,E=b.cid,y=b.demurrage,h=!!o.length,C=Object(a.useRef)(),v="top"===i||"bottom"===i,O=w().api,g=Object(a.useState)([]),j=Object(m.a)(g,2),S=j[0],k=j[1],N=Object(a.useState)(null),I=Object(m.a)(N,2),T=I[0],R=I[1];Object(a.useEffect)((function(){E&&(t&&console.log("GETTING BOOTSTRAPPERS",E),O.query.encointerCurrencies.bootstrappers(E).then((function(e){t&&console.log("BOOTSTRAPPERS RECEIVED",e),k(e.toJSON())})))}),[O.query.encointerCurrencies,E,t]),Object(a.useEffect)((function(){E&&(t&&console.log("GETTING MONEYSUPPLY",E),O.query.encointerBalances.totalIssuance(E).then((function(e){t&&console.log("MONEYSUPPLY RECEIVED",e),R(pe(e.get("principal")))})))}),[O.query.encointerBalances,E,t]);return r.a.createElement(z.a,{className:"details-sidebar",ref:C,as:A.a.Group,animation:"overlay",icon:"labeled",direction:i,visible:h,width:u,onShow:function(){return C.current&&c(C.current.ref.current["offset".concat(v?"Height":"Width")])}},r.a.createElement(A.a,{padded:!0},r.a.createElement(ce.a,null,r.a.createElement(Y.a,{name:"money bill alternate"}),r.a.createElement(ce.a.Content,null,"Currency info"))),r.a.createElement(A.a,{textAlign:"center"},r.a.createElement(ce.a,{sub:!0,textAlign:"left"},"Currency ID:"),r.a.createElement(oe.a,{size:"small",color:"blue"},o),r.a.createElement("p",null,d)),r.a.createElement(A.a.Group,null,r.a.createElement(A.a.Group,{horizontal:!0},r.a.createElement(A.a,null,r.a.createElement(ce.a,{sub:!0},"Demurrage rate (per month):"),y&&y.toFixed(2),"%",r.a.createElement(ce.a,{sub:!0},"participants registered:"),s,r.a.createElement(ce.a,{sub:!0},"participants registered in last ceremony:"),l),r.a.createElement(A.a,null,r.a.createElement(ce.a,{sub:!0},"Money supply:"),r.a.createElement("p",null,T&&new Ee(T).toFormat(2)),r.a.createElement(ce.a,{sub:!0},"meetups assigned:"),f,r.a.createElement(ce.a,{sub:!0},"meetups assigned in last ceremony:"),p)),r.a.createElement(A.a,{loading:!S.length,stacked:!0},r.a.createElement(ce.a,{sub:!0},"List of bootstrappers:"),r.a.createElement(ie.a,null,S.map((function(e){return r.a.createElement(ie.a.Item,{key:e},e)}))))),r.a.createElement(A.a,{textAlign:"right",className:"map-sidebar-close"},r.a.createElement(B.a,{content:"Close",icon:"angle "+(v?"down":"right"),labelPosition:"right",onClick:n})))}var he=r.a.memo((function(e){var t=w().api;return t&&t.query&&t.query.encointerCurrencies&&t.query.encointerBalances?r.a.createElement(ye,e):null}),(function(e,t){return e.hash===t.hash&&(!t.hash||e.participantCount===t.participantCount&&e.lastParticipantCount===t.lastParticipantCount&&e.meetupCount===t.meetupCount&&e.lastMeetupCount===t.lastMeetupCount)})),Ce=n(550),ve=n(552),Oe=n(268),ge=n.n(Oe),je=M.divIcon,Se="marker-cluster marker-cluster-small ".concat("encoiner-community-icon"),ke="marker-cluster marker-cluster-small ".concat("encoiner-cluster-custom"),we=[40,40],Ne=function(e,t){return new je({iconSize:we,className:"".concat(e),html:"<div><span>".concat(t,"</span></div>")})},Ie=function(e){return Ne(Se.concat(" ",e),"$")},Te=function(e,t){return Ne(ke.concat(" ",e),t)},Re=Ie(""),Pe=Ie("pulse"),xe=Ie("yellow pulse"),_e=Ie("yellow"),De=Ie("red"),Ae=new M.Icon({iconUrl:"https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]}),ze=function(e,t,n){var a;return a=0===e?t?"green":"yellow":0!==t?t>1?"green":"yellow":"red",n?a.concat(" pulse"):a},Me=[40,40],qe={"green pulse":Pe,"yellow pulse":xe,"red pulse":xe,green:Re,yellow:_e,red:De},Ge=function(e,t,n){var a=ze(e,t,n);return qe[a]},Le=function(e){var t=e.getAllChildMarkers(),n=t[0].options.phase,a=t.map((function(e){return e.options.count})).reduce((function(e,t){return t>e?t:e}),0),r=t.map((function(e){return e.options.active})).reduce((function(e,t){return t||e}),!1),c=ze(n,a,r),o=e.getChildCount();return Te(c,o)},Be={timers:{},byCID:{},phase:-1},Ue=function(e,t){switch(t.type){case"initialize":return function(e,t){var n=t.payload,a=n.phase,r=n.byCID;return Object(i.a)({},e,{byCID:r,phase:a})}(e,t);case"phase":return Object(i.a)({},e,{phase:t.payload});case"reset":return function(e,t){var n=t.payload,a=n.phase,r=n.byCID,c=Object(i.a)({},e.byCID);for(var o in c)c[o].count=r[o]||0;return Object(i.a)({},e,{byCID:c,phase:a})}(e,t);case"activate":return function(e,t){var n=t.payload,a=n.timers,r=Object(i.a)({},e.byCID,{},n.byCID);for(var c in a)e.timers[c]&&clearTimeout(e.timers[c]);return Object(i.a)({},e,{byCID:r,timers:Object(i.a)({},e.timers,{},a)})}(e,t);case"deactivate":return function(e,t){var n=t.payload,a=Object(i.a)({},e.byCID),r=Object(i.a)({},e.timers);return a[n]=Object(i.a)({},a[n],{active:!1}),clearTimeout(r[n]),r[n]=0,Object(i.a)({},e,{byCID:a,timers:r})}(e,t);default:return e}};function Ye(e){var t=e.cids,n=e.data,c=e.selected,o=e.state,i=Object(a.useReducer)(Ue,Be),u=Object(m.a)(i,2),s=u[0],l=u[1],p=Object(a.useRef)(null),f=o.subscribtionPhase,b=o[["participants","meetups","meetups"][f]],d=o.attestations,E=s.byCID;if(-1===s.phase&&-1!==f){var y=t.map((function(e,t){var a=n[e],r=a.gps,c=a.name,i=o.meetups[e]||0;return{name:c,key:e,position:r,active:!1,count:f?i:b[e]||0,attests:2===f&&d[e]||0}})).reduce((function(e,t){return e[t.key]=t,e}),{});l({type:"initialize",payload:{byCID:y,phase:f}})}else(f>s.phase||0===f&&2===s.phase)&&l({type:"reset",payload:{byCID:b,phase:f}});return Object(a.useEffect)((function(){var e={},n={};t.forEach((function(t){var a=b&&b[t]||0,r=d?d[t]:0;(s.byCID[t].count<a||s.byCID[t].attests<r)&&(e[t]=s.byCID[t],e[t].count=a,e[t].attests=d[t]||0,e[t].active=!0,n[t]=setTimeout((function(){l({type:"deactivate",payload:t})}),3e3))})),l({type:"activate",payload:{byCID:e,timers:n}})}),[b,d,t]),Object(a.useEffect)((function(){var e,t=[];for(var n in s.byCID)s.byCID[n].active&&t.push(n);return t.length&&(e=setTimeout((function(){null!==p.current&&p.current.leafletElement&&p.current.leafletElement.refreshClusters()}),10)),function(){e&&clearTimeout(e)}}),[E]),r.a.createElement(ge.a,{ref:p,onClick:function(t){return t.sourceTarget.options.alt&&e.onClick(t.sourceTarget.options.alt)},iconCreateFunction:Le,chunkedLoading:!0},Object.keys(E).map((function(e){var t=E[e],n=t.key,a=t.position,o=t.name,i=t.active,u=t.count,l=t.attests;return c===e?null:r.a.createElement(Ce.a,{key:n.concat(f,l,u,i?"force-redraw":""),position:a,alt:e,count:u,active:i,phase:f,attests:l,icon:Ge(s.phase,u,i)},r.a.createElement(ve.a,{direction:"top",offset:[0,Me[1]/-2]},o))})))}var Ve=function(e){var t=e.getAllChildMarkers(),n=t[0].options.phase,a=t[0].options.count,r=t[0].options.active,c=t.length;return Te(ze(n,a,r),c)},Fe=function(e,t){switch(t.type){case"reset":return{active:!1,count:0,attest:0,timeout:e.timeout};case"activate":return function(e,t){var n=t.payload,a=n.count,r=n.timeout,c=n.attest;return Object(i.a)({},e,{active:!0,count:a,attest:c,timeout:r})}(e,t);case"deactivate":return function(e,t){return clearTimeout(e.timeout),Object(i.a)({},e,{active:!1})}(e);default:return e}};function Ke(e){var t=e.phase,n=e.meetupCount,c=e.participantCount,o=e.attestationCount,i=e.data.coords,u=Object(a.useRef)(null),s=0===t?c:n,l=Object(a.useReducer)(Fe,{active:!1,count:s,attest:o}),p=Object(m.a)(l,2),f=p[0],b=p[1],d=f.active;return Object(a.useEffect)((function(){if(0===s&&0===t&&(f.attest>0||f.count>0))b({type:"reset"});else if(f.count<s||f.attest<o){var e=setTimeout((function(){b({type:"deactivate"})}),3e3);b({type:"activate",payload:{count:s,timeout:e,attest:o}})}}),[f,s,o,t]),Object(a.useEffect)((function(){var e;return d&&(e=setTimeout((function(){null!==u.current&&u.current.leafletElement&&u.current.leafletElement.refreshClusters()}),10)),function(){e&&clearTimeout(e)}}),[d]),i&&i.length?r.a.createElement(ge.a,{ref:u,iconCreateFunction:Ve},i.map((function(e,n){return r.a.createElement(Ce.a,{position:e,key:"".concat(n,s,o,d?"force-redraw":""),phase:t,count:s,attest:f.attest,active:d,icon:Ae})}))):null}n(1324),n(1325);var Ze=M.latLng(47.166168,8.515495),He=function(e){return me(e,16)},Je=function(e){return[He(e.lat),He(e.lon)]},We=function(e){return 100*(1-Math.exp(-1*pe(e)*427200))},Qe={url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'},$e=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=e&&e.queryMulti&&e.query;return n&&t?!!n[t]:!!n},Xe=0,et=function(e){return Object.keys(e).reduce((function(t,n){return t+=e[n]}),0)},tt={subscribtionCeremony:0,subscribtionPhase:-1,lastCeremony:{participants:{},meetups:{},attestations:{}},subscribtions:[],participantCount:0,meetupCount:0,attestationCount:0,participants:{},meetups:{},attestations:{}},nt=function(e,t){switch(t.type){case"unsubscribeAll":return e.subscribtions.forEach((function(e){return e()})),Object(i.a)({},e,{subscribtions:[]});case"subscribe":return e.subscribtions.forEach((function(e){return e()})),Object(i.a)({},e,{},t.payload);case"participants":return function(e,t){var n=Object(i.a)({},e.participants,Object(P.a)({},t.payload.cid,t.payload.count)),a=et(n);return Object(i.a)({},e,{participants:n,participantCount:a})}(e,t);case"meetups":return function(e,t){var n=Object(i.a)({},e.meetups,Object(P.a)({},t.payload.cid,t.payload.count)),a=et(n);return Object(i.a)({},e,{meetups:n,meetupCount:a})}(e,t);case"attestations":return function(e,t){var n=Object(i.a)({},e.attestations,Object(P.a)({},t.payload.cid,t.payload.count)),a=et(n);return Object(i.a)({},e,{attestations:n,attestationCount:a})}(e,t);case"last":return Object(i.a)({},e,{lastCeremony:t.payload});case"reset":return e.subscribtions.forEach((function(e){return e()})),e.subscribtionCeremony&&e.subscribtionCeremony!==e.lastCeremony.subscribtionCeremony?Object(i.a)({},tt,{lastCeremony:{subscribtionCeremony:e.subscribtionCeremony,meetups:Object(i.a)({},e.meetups),meetupCount:e.meetupCount,attestations:Object(i.a)({},e.attestations),attestationCount:e.attestationCount,participants:Object(i.a)({},e.participants),participantCount:e.participantCount,subscribtions:null,lastCeremony:null}}):e;default:throw new Error("unknown action ".concat(t.type))}},at=["participants","meetups","attestations"];function rt(e){var t=e.debug,n=Object(a.useRef)(),c=w().api,o=Object(a.useState)({selected:"",loading:!0,menu:!1}),u=Object(m.a)(o,2),p=u[0],f=u[1],b=Object(a.useState)([]),d=Object(m.a)(b,2),E=d[0],y=d[1],h=Object(a.useState)([]),C=Object(m.a)(h,2),v=C[0],O=C[1],g=Object(a.useState)({}),j=Object(m.a)(g,2),S=j[0],k=j[1],N=Object(a.useState)(Ze),I=Object(m.a)(N,2),T=I[0],R=I[1],P=Object(a.useState)({phase:-1,timestamp:0,timer:null}),B=Object(m.a)(P,2),U=B[0],Y=B[1],F=Object(a.useState)(0),K=Object(m.a)(F,2),Z=K[0],H=K[1],J=Object(a.useReducer)(nt,tt),W=Object(m.a)(J,2),$=W[0],X=W[1],ee=c&&c.query&&c.query.encointerCurrencies,te=c&&c.query&&c.query.encointerScheduler;function ne(){return(ne=Object(l.a)(s.a.mark((function e(n,a){var r,c,o,u,l;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return r=function(e,t,n){return e[a[n]]=t,e},t&&console.log("FETCHING LOCATIONS AND PROPERTIES"),e.t0=Promise,e.next=5,be(ee.locations,n,(function(e){return e.map(Je)}));case 5:return e.t1=e.sent,e.next=8,be(ee.currencyProperties,n);case 8:return e.t2=e.sent,e.t3=[e.t1,e.t2],e.next=12,e.t0.all.call(e.t0,e.t3);case 12:c=e.sent,o=Object(m.a)(c,2),u=o[0],l=o[1],t&&console.log("SETTING DATA",u,l),k(n.map((function(e,t){return{cid:e,coords:u[t],gps:M.latLngBounds(u[t]).getCenter(),demurrage:We(l[t].demurrage_per_block),name:l[t].name_utf8.toString()}})).reduce(r,{})),f(Object(i.a)({},p,{loading:!1}));case 19:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function ce(e){return function(){return n.current.leafletElement[e<0?"zoomOut":"zoomIn"]()}}Object(a.useEffect)((function(){if(t&&console.log("phases",U),$e(c,"encointerScheduler")){var e=c.query.encointerScheduler,n=e.currentPhase,a=e.nextPhaseTimestamp,r=function(e,t,n){(U.phase!==e||U.timestamp!==t||!n)&&Y({phase:e,timestamp:t,timer:n})};return U.timer||c.queryMulti([n,a]).then((function(e){var t=Object(m.a)(e,2),n=t[0],a=t[1],c=n.toNumber(),o=a.toNumber(),i=o-Date.now()+500;i<=0&&(i=3e3);var u=null===U.timer&&setTimeout((function(){return r(c,o,null)}),i);u&&r(c,o,u)})).catch(console.error),function(){U.timer&&clearTimeout(U.timer)}}}),[U,t,te,c]),Object(a.useEffect)((function(){if($e(c,"encointerScheduler")){var e=c.query.encointerScheduler.currentCeremonyIndex;t&&console.log("ceremony id",U.phase,Z);var n=c.registry.getOrUnknown("CurrencyCeremony"),a=function(){var e=Object(l.a)(s.a.mark((function e(a,r,o){var i,u,l,m,p;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if($e(c,"encointerCeremonies")){e.next=2;break}return e.abrupt("return");case 2:if(!(a.toNumber()<=$.subscribtionCeremony&&0===r)){e.next=5;break}return e.abrupt("return");case 5:for(i=c.query.encointerCeremonies,u=i.participantCount,l=i.meetupCount,m=function(e){o.forEach((function(r){var o=new n(c.registry,[r,a]),i=[u,l][e];t&&console.log("hist ",q.encode(r),a.toNumber(),e),i(o).then((function(t){return X({type:at[e],payload:{cid:q.encode(r),count:t.toNumber()}})}))}))},p=0;p<r;p++)m(p);case 8:case"end":return e.stop()}}),e)})));return function(t,n,a){return e.apply(this,arguments)}}(),r=function(){var e=Object(l.a)(s.a.mark((function e(t,a){var r,o,i,u,l,p;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if($e(c,"encointerCeremonies")){e.next=2;break}return e.abrupt("return");case 2:return r=c.query.encointerCeremonies,o=r.participantCount,i=r.meetupCount,u=t.sub(new G.u32(c.registry,1)),e.next=6,Promise.all(a.map((function(e){var t=new n(c.registry,[e,u]);return c.queryMulti([[o,t],[i,t]])})));case 6:l=e.sent,p=l.reduce((function(e,t,n){var r=q.encode(a[n]),c=Object(m.a)(t,2),o=c[0],i=c[1];return e.meetups[r]=i.toNumber(),e.participants[r]=o.toNumber(),e.participantCount=e.participants[r]+e.participantCount,e.meetupCount=e.meetups[r]+e.meetupCount,e}),{subscribtionCeremony:u.toNumber(),meetups:{},participants:{},participantCount:0,meetupCount:0}),X({type:"last",payload:p});case 9:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),o=function(){var e=Object(l.a)(s.a.mark((function e(n,a,r){var o,i,u,l,m,p,f,b;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if($e(c,"encointerCeremonies")){e.next=2;break}return e.abrupt("return");case 2:if(!((o=n.toNumber())<=$.subscribtionCeremony&&a<=$.subscribtionPhase)){e.next=5;break}return e.abrupt("return");case 5:return t&&console.log("subscribe to ceremony",o,a),i=c.query.encointerCeremonies,u=i.participantCount,l=i.attestationCount,m=i.meetupCount,p=[u,m,l],f=c.registry.getOrUnknown("CurrencyCeremony"),e.next=11,Promise.all(r.map((function(e){var t=new f(c.registry,[e,Z]);return(0,p[a])(t,(function(t){return X({type:at[a],payload:{cid:q.encode(e),count:t.toNumber()}})}))})));case 11:b=e.sent,X({type:"subscribe",payload:{subscribtions:b,subscribtionCeremony:o,subscribtionPhase:a}});case 13:case"end":return e.stop()}}),e)})));return function(t,n,a){return e.apply(this,arguments)}}();Z||e().then((function(e){t&&console.log("set ceremonyIndex",e.toString()),H(e)})),Z&&(Z.toNumber()!==$.subscribtionCeremony||U.phase!==$.subscribtionPhase)&&E.length&&(o(Z,U.phase,E),a(Z,U.phase,E),!$.lastCeremony.subscribtionCeremony&&r(Z,E)),U.phase===Xe&&($.subscribtionCeremony!==$.lastCeremony.subscribtionCeremony&&X({type:"reset"}),e().then((function(e){t&&console.log("set ceremonyIndex",e.toString()),H(e)})))}}),[U.phase,Z,E,te,t,c,at]),Object(a.useEffect)((function(){t&&console.log("cids",E),ee&&0===E.length&&ee.currencyIdentifiers().then((function(e){var t=e.map(q.encode);y(e),O(t)})).catch((function(e){return console.error(e)}))}),[E,t,ee]),Object(a.useEffect)((function(){t&&console.log("get locations"),E.length&&E.length===v.length&&function(e,t){ne.apply(this,arguments)}(E,v)}),[E,v]),Object(a.useEffect)((function(){t&&console.log("get position");var e=n.current;null!=e&&T===Ze&&e.leafletElement.locate()}),[n,T]),Object(a.useEffect)((function(){t&&console.log("update resize");var e=n.current&&n.current.leafletElement;e&&setTimeout((function(t){return e.invalidateSize()}),50)}),[p.sidebarSize]);return r.a.createElement(D.a,{as:A.a.Group,className:"encointer-map",fireOnMount:!0,onUpdate:function(e,t){var n=t.width;return f(Object(i.a)({},p,{portrait:n<D.a.onlyMobile.maxWidth,width:n}))}},r.a.createElement(z.a.Pushable,{as:A.a,className:"component-wrapper"},r.a.createElement(V,{visible:p.menu}),r.a.createElement(he,{onClose:function(){n.current.leafletElement.setZoom(p.prevZoom),f(Object(i.a)({},p,{selected:"",sidebarSize:0}))},onShow:function(e){return f(Object(i.a)({},p,{sidebarSize:e,menu:!1}))},hash:p.selected,direction:p.portrait?"bottom":"right",width:"very wide",data:S[p.selected]||{},participantCount:p.selected&&$.participants[p.selected]||0,lastParticipantCount:p.selected?$.lastCeremony.participants[p.selected]:0,meetupCount:p.selected&&$.meetups[p.selected]||0,lastMeetupCount:p.selected?$.lastCeremony.meetups[p.selected]:0,debug:t}),r.a.createElement(z.a.Pusher,{className:"encointer-map-wrapper",style:{marginRight:p.portrait?"0":p.sidebarSize+"px"}},r.a.createElement(Q,{small:p.portrait,participantCount:$.participantCount,meetupCount:$.meetupCount,attestationCount:$.attestationCount,currentPhase:U}),r.a.createElement(ae,{style:p.portrait&&p.selected?{display:"none"}:{}}),r.a.createElement(re,{onClick:function(){return f(Object(i.a)({},p,{menu:!p.menu,selected:p.menu?p.selected:"",sidebarSize:p.menu?p.sidebarSize:0}))},loading:p.loading,onZoomIn:ce(1),onZoomOut:ce(-1)}),r.a.createElement(x.a,{center:T,zoom:4,ref:n,zoomControl:!1,touchZoom:!0,onClick:function(){return p.menu&&f(Object(i.a)({},p,{menu:!1}))},style:{height:function(){if(p.portrait&&p.selected&&p.sidebarSize&&null!==n.current){if("100%"===n.current.container.style.height){var e=n.current.container.offsetHeight-p.sidebarSize;return"".concat(e,"px")}return n.current.container.style.height}return"100%"}()},onLocationFound:function(e){R(e.latlng);var t=n.current.leafletElement;t.flyTo(e.latlng),t.setZoom(8)}},r.a.createElement(_.a,Qe),p.selected?r.a.createElement(Ke,{participantCount:p.selected&&$.participants[p.selected]||0,meetupCount:p.selected&&$.meetups[p.selected]||0,attestationCount:p.selected&&$.attestations[p.selected]||0,phase:U.phase,data:S[p.selected]}):null,p.loading?null:r.a.createElement(Ye,{data:S,cids:v,state:$,onClick:function(e){var t=n.current.leafletElement;f(Object(i.a)({},p,{selected:e,prevZoom:t.getZoom()}));var a=M.latLngBounds(S[e].coords).pad(2);t.fitBounds(a)},selected:p.selected})))),t?r.a.createElement(L,null):null)}n(1326);function ct(){return r.a.createElement(rt,{debug:!0})}o.a.render(r.a.createElement((function(){return r.a.createElement(k,null,r.a.createElement(ct,null))}),null),document.getElementById("root"))},555:function(e){e.exports=JSON.parse('{"APP_NAME":"encointer-explorer","DEVELOPMENT_KEYRING":false,"CUSTOM_TYPES":{"Address":"AccountId","LookupSource":"AccountId","CeremonyPhaseType":{"_enum":["Registering","Assigning","Attesting"]},"CeremonyIndexType":"u32","ParticipantIndexType":"u64","MeetupIndexType":"u64","AttestationIndexType":"u64","CurrencyIdentifier":"Hash","BalanceType":"i128","BalanceEntry":{"principal":"i128","last_update":"BlockNumber"},"CurrencyCeremony":"(CurrencyIdentifier,CeremonyIndexType)","Location":{"lat":"i64","lon":"i64"},"Reputation":{"_enum":["Unverified","UnverifiedReputable","VerifiedUnlinked","VerifiedLinked"]},"CurrencyPropertiesType":{"name_utf8":"Text","demurrage_per_block":"i128"},"Attestation":"Vec<u8>","ProofOfAttendance":"Vec<u8>"}}')},577:function(e,t,n){e.exports=n(1327)},607:function(e,t){},654:function(e,t){},656:function(e,t){},665:function(e,t){},667:function(e,t){},694:function(e,t){},696:function(e,t){},697:function(e,t){},703:function(e,t){},705:function(e,t){},723:function(e,t){},726:function(e,t){},742:function(e,t){},745:function(e,t){},775:function(e,t){}},[[577,1,2]]]);
//# sourceMappingURL=main.7d6830f0.chunk.js.map