/**
 * 异步请求
 * @param {Object} options
 */
importScripts('transform.js')
var tp_obj = TileLnglatTransform.TileLnglatTransformBaidu
var ajax = function(options) {
	options = options || {};
	options.type = (options.type || "GET").toUpperCase();
	options.dataType = options.dataType || "json";
	var params = options.dataType == ("json" || "JSON") ? options.data : formatParams(options.data);

	//创建 - 非IE6 - 第一步
	if(XMLHttpRequest) {
		var xhr = new XMLHttpRequest();
	} else { //IE6及其以下版本浏览器
		var xhr = new ActiveXObject('Microsoft.XMLHTTP');
	}

	//格式化参数
	function formatParams(data) {
		var arr = [];
		for(var name in data) {
			arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
		}
		arr.push(("v=" + Math.random()).replace(".", ""));
		return arr.join("&");
	}
	//连接 和 发送 - 第二步
	if(options.type == ("GET" || "get")) {
		console.log(options.type)
		xhr.open("GET", options.url + "?" + params, true);
		xhr.send(null);
	} else if(options.type == ("POST" || "post")) {
		xhr.open("POST", options.url, true);
		//设置表单提交时的内容类型
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
		if(typeof params == 'object') {
			params = JSON.stringify(params)
		}
		xhr.send(params);
	}

	//接收 - 第三步
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			var status = xhr.status;
			if(status >= 200 && status < 300) {
				options.success && options.success(xhr.responseText);
			} else {
				options.fail && options.fail(status);
			}
		}
	}
}

var time = 3000,
	v = 0;

function matchCar(data) {
	if(data == null) {
		return null;
	}
	var id = data.terminalId;
	return eval('(' + '{' + id + ':[{"lng":' + data.lng + ',"lat":' + data.lat + '}]}' + ')');
}

var geo, timer, old, ts;
//http://localhost:8000/onlinepoints?type=tile&x=6605&y=1776&level=15
var url = "http://106.15.57.39:9876/onlinepoints";

function getResource(index, points) {
	if(points != undefined)
		old = points;
	if(ts != null)
		old["ts"] = parseInt(ts) + 5;
	j = (index !== undefined) ? index : v;
	ajax({
		url: url,
		type: "post",
		dataType: "json",
		data: old,
		success: function(data) {
			if(data != null && data != "" ) {
				data = JSON.parse(data);
				if(data.geo.length == 0)
					return;
				console.log(data.geo)
				ts = data.ts;
				tmp = data.geo;
				for(var i = 0; i < tmp.length; i++) {
					((i) => {
						tp = tmp[i].tp.split('-');
						ids = tmp[i].terminalId.split(',');
						lnglat = tp_obj.pixelToLnglat(parseInt(tp[3]) * 4, parseInt(tp[4]) * 4, parseInt(tp[1]), parseInt(tp[2]), parseInt(tp[0]))
						for(var l = 0; l < ids.length; l++) {
							point = {
								"terminalId": ids[l],
								"lng": lnglat.lng,
								"lat": lnglat.lat
							}
							if(geo == undefined) {
								geo = matchCar(point);
							} else {
								var id = point.terminalId;
								if(index != undefined || null) {
									if(geo.hasOwnProperty(id)) {
										geo[id].push({
											'lng': point.lng,
											'lat': point.lat
										});
									} else {
										geo[id] = [{
											'lng': point.lng,
											'lat': point.lat
										}];
									}
								} else {
									geo[id] = [{
										'lng': point.lng,
										'lat': point.lat
									}];
								}
							}
						}
					})(i);
				}
				v++;
				postMessage(geo);
			}
		},
		fail: function(status) {
			clearInterval(timer)
		}
	});
}

/**
 * 间隔interval秒调用一次
 * @param {Object} interval
 */
function useInterval(interval, data) {

	if(old !=null &&data.level == old.level && data.northEast[0] == old.northEast[0] &&data.northEast[1] == old.northEast[1] && data.southWest[0] ==old.southWest[0]&& data.southWest[1] ==old.southWest[1])
		return;
	if(timer != (undefined || null)) {
		clearInterval(timer);
		timer = null;
	}
	if(timer == (undefined || null)) {
		for(var i = 0; i < 1; i++) {
			(function(i) {
				getResource(i, data);
			})(i);
		}
	}
	timer = setInterval(() => {
		getResource(null, data);
	}, interval);
}

onmessage = function(event) {
	console.log(event.data);
	if(event.data != null) {
		useInterval(time, event.data)
	}
}