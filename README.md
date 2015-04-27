
## Request Format:

### Delete [GET]
	ex, http://server_name:port/events/12/delete

### Update [POST]
	ex, http://server_name:port/events/12/update

### Add [POST]
	ex, http://server_name:port/events

### Query/List [GET]
	ex, http://server_name:port/events/12 or http://server_name:port/events/all

```
	Note: Only support GET, POST method and JSON data type for now
```

## Session ID
Everytime you request services (except user login/register), please make sure put session_id.

ex,
1. GET request
http://server_name:port/events/12/update?session_id=xxs2sd // just for example
2. POST request
http://server_name:port/events/12/update // post session_id:xx2sd into body
## Response Format:

```
{
	data: {

	},
	err: {
		code: 404/403 // same as http code,
		msg: "" // description of this error
	}
}
```


## Server[Dev]

### URL: http://192.168.1.118:3000/

### API 

* Store

	1. List
		store/all?locale=[en|cn]&lat=[number]&lon=[number]&radius=[radius]

	2. Detail
		store/[sid]?locale=[en|cn]

* Product

	1. List
		product/all?locale=[en|cn]&taxonomy=[taxonomy_id|taxonomy_en_name]&screen_size=[screen_size]&device_type[device_type]&highlight=[true|false]

	2. Detail
		product/[sid]?locale=[en|cn]&taxonomy=[taxonomy_id|taxonomy_en_name]&screen_size=[screen_size]&device_type[device_type]

* Event
	1. List
		event/all?locale=[en|cn]&sdate=[sdate]&edate=[edate]&status=[on|off]

	2. Detail
		event/:id?locale=[en|cn]

* Coupon
	1. List
		coupon/all?locale=[en|cn]&sdate=[sdate]&edate[edate]&uid=[uid]
	2. Detail
		coupon/:cid?locale=[en|cn]&uid=[uid]

* Register Token
	1. Get token
		token/register/[md5data]?timestamp=[unixtimestamp]


