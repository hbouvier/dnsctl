module.exports = function () {

    function REST(config) {
        var $this = this;
            
        this.http    = require('http');
        this.config  = config;
        this.meta    = config.meta;
        this.version = config.version;
        this.logger  = config.logger;
        this.context = config.context;
        this.urls    = config.dns_urls.split(',').map(function (url) {
          var tuple = url.split(':');
          return {
              proto : tuple[0],           // http
              host  : tuple[1].substr(2), // 127.0.0.1
              port  : tuple[2]            // 8053
          };
        });
        this.logger.log('debug', 'dns::urls=', this.urls, this.meta);
    }

    REST.prototype.get = function (id, next) {
      var $this = this,
          options = {
          'method'  : 'GET',
          'host'    : $this.urls[0].host,
          'port'    : $this.urls[0].port,
          'path'    : $this.context + '/hostname' + (typeof(id) === 'undefined' ? '' : ('/' + id)),
          'headers' : {
                        'User-Agent'     : 'dnsctl'
          }
        };

      $this.logger.log('debug', 'REST:get|id=%s|options=%j', id, options, $this.meta);
      var req = $this.http.request(options, function(res) {
        var data = '';
        $this.logger.log('debug', 'REST:get|id=%s|code=%s', id, res.statusCode, $this.meta);
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          if (next)
            next(null, JSON.parse(data));
        });
      });

      req.on('error', function(err) {
        $this.logger.log('error', 'REST:get|id=%s|error=%s|err=%j', id, err, err, $this.meta);
        if (next)
          next(err, null);
        });
        req.end();
    };

    REST.prototype.put = function (id, body, next) {
      var $this = this,
          options = {
          'method'  : 'PUT',
          'host'    : $this.urls[0].host,
          'port'    : $this.urls[0].port,
          'path'    : $this.context + '/hostname' + (typeof(id) === 'undefined' ? '' : ('/' + id)),
          'headers' : {
                        'User-Agent'     : 'dnsctl',
                        'Content-Type'   : 'application/json; utf8',
                        'Content-Length' : Buffer.byteLength(JSON.stringify(body)),
          }
        };
      var req = $this.http.request(options, function(res) {
        var data = '';
        $this.logger.log('debug', 'REST:post|id=%s|code=%s|body=%s', id, res.statusCode, body, $this.meta);
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          if (next)
            next(null, data);
        });
      });

      req.on('error', function(err) {
        $this.logger.log('error', 'REST:post|id=%s|error=%s|err=%j|body=%s', id, res, err, err, body, $this.meta);
        if (next)
          next(err, null);
      });
      req.end(JSON.stringify(body));
    };

    REST.prototype.delete = function (id, next) {
      var $this = this,
          options = {
          'method'  : 'DELETE',
          'host'    : $this.urls[0].host,
          'port'    : $this.urls[0].port,
          'path'    : $this.context + '/hostname' + (typeof(id) === 'undefined' ? '' : ('/' + id)),
          'headers' : {
                        'User-Agent'     : 'dnsctl'
          }
        };

      var req = $this.http.request(options, function(res) {
        var data = '';
        $this.logger.log('debug', 'REST:get|id=%s|code=%s', id, res.statusCode, $this.meta);
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          if (next)
            next(null, data);
        });
      });

      req.on('error', function(err) {
        $this.logger.log('error', 'REST:get|id=%s|error=%s|err=%j', id, res, err, err, $this.meta);
        if (next)
          next(err, null);
        });
        req.end();
    };

    function create(config) {
        return new REST(config);
    }

    return {
        create : create
    };
}();
