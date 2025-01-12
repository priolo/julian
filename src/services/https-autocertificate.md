
## AUTOCERTIFICAZIONE

- download openssl
- openssl genrsa -out privkey.pem 1024
- openssl req -config ..\openssl.cnf -new -key privkey.pem -out myserver.csr
- openssl x509 -req -days 366 -in myserver.csr -signkey privkey.pem -out pubcert.pem

```javascript
var https = require('https')
	.Server({
			key: fs.readFileSync('privkey.pem'),
			cert: fs.readFileSync('pubcert.pem')
		  }, app);
		  
https.listen(3000, () => {
		console.log("Server start on port 3000!");
	});		  
```


riferimento  
http://www.devapp.it/wordpress/un-server-https-con-node-js/