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
var email = "kryptonia_user@gmail.com";
var password = "password";
```

## Running
```
node bot.js
```

### To Use PM2 after installing its dependencies. run this codes.
**Starting**
```
pm2 start bot.js
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

### APIs
**Get all post**
```
http://localhost:3000/api/get-all-post
```

**Get all voted post**
```
http://localhost:3000/api/get-all-voted
```

**Get all unvoted post**
```
http://localhost:3000/api/get-all-unvoted
```

**Get voting history**
```
http://localhost:3000/api/voting-history
```

### Interface Manager
```
https://github.com/gabrielarlo/kryptonia-steembot-manager