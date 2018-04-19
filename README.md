# kryptonia-steembot

###### Voter Bot from Kryptonia

_Right now it is on **BETA** version_

## Installing Dependencies
```
npm install
```

## Basic Setup
```
var host = 'http://localhost:8000';
var email = "gabrielarlo11@gmail.com";
var password = "password";
```

## Running
```
node voter.js
```

### To Use PM2 after installing its dependencies. run this codes.
**Starting**
```
pm2 start voter.js
```

**Show Status**
```
pm2 show 0
```

**Monitor**
```
pm2 monit
```

**Stopping**
```
pm2 stop 0
```