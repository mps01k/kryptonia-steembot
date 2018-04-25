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
http://localhost:1433/api/get-all-post
```

**Get all voted post**
```
http://localhost:1433/api/get-all-voted
```

**Get all unvoted post**
```
http://localhost:1433/api/get-all-unvoted
```

**Get all invalid link post**
```
http://localhost:1433/api/get-all-invalid-link
```

**Get all post with low reputation score author**
```
http://localhost:1433/api/get-all-low-reputation
```

**Get all older than 7 days post**
```
http://localhost:1433/api/get-all-old-post
```

**Get all post that has error when voting**
```
http://localhost:1433/api/get-all-errored
```

**Get voting history**
```
http://localhost:1433/api/voting-history
```

### Interface Manager
```
https://github.com/gabrielarlo/kryptonia-steembot-manager