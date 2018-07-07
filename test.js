var pattern = /[0-9a-z]+\.([0-9a-z]+\.[0-9a-z]{2,}|[0-9a-z]+)/gi;
var url = 'https://www.baidu.com/hh/hh';
console.log(url.match(pattern));