module.exports = function () {

    function DnsCtl(config) {
        var $this = this;
        this.config  = config;
        this.meta    = config.meta;
        this.version = config.version;
        this.logger  = config.logger;
    }

    DnsCtl.prototype.exec = function (options) {
        var $this = this,
            args  = options.args;

        switch (options.args[0]) {
            case "version":
                console.log('Version ', $this.version);
                break;
            case "set":
                if (options.args.length >= 3) {
                    var params = options.args.slice(2);
                    $this.set(options.args[1], params);
                } else
                    console.log("Usage: set hostname ipv4,ipv6 {ipv4,ipv6} {...,...}");
                break;
            case "get":
                if (options.args.length === 2)
                    $this.get(options.args[1]);
                else
                    console.log("Usage: get hostname");
                break;
            case "del":
                if (options.args.length === 2)
                    $this.del(options.args[1]);
                else
                    console.log("Usage: del hostname");
                break;
            default:
                console.log("Unknow command ", options.args[0]);
                break;
        }
    };

    DnsCtl.prototype.filterPrefix = function (obj) {
        var len    = this.config.dns.prefix.length,
            object = {};

        for (name in obj) {
            if (name.substring(0, len) === this.config.dns.prefix && obj.hasOwnProperty(name)) {
                object[name.substring(len)] = obj[name];
            }
        }
        return object;
    }

    DnsCtl.prototype.get = function (key) {
        var $this = this;

        var redis = require('redisd').create($this.config);
        redis.connect(function () {
            if (key.indexOf('*') !== -1) {
                redis.mgetkeys($this.config.dns.prefix + key, function (err, values) {
                    var filteredValues = !err ? $this.filterPrefix(values) : null;
                    console.log(err ?"FAIL": JSON.stringify(filteredValues));
                    redis.close();
                });
            } else {
                redis.get($this.config.dns.prefix + key, function (err, value) {
                    console.log(err ?"FAIL": value);
                    redis.close();
                });
            }
        });
    };
    DnsCtl.prototype.set = function (key, values) {
        var $this  = this,
            record = {
                host : key,
                PTR  : null
            };

        if (values && values.length) {
            var A    = [],
                AAAA = [];

            values.forEach(function (value) {
                var tuple = value.split(',');
                if (tuple.length !== 2) {
                    console.log('ERROR: You must specify an IPv4,IPv6 pair (e.g. 192.168.1.1,1:2:3:4:5:6:7:8) without any spaces. Got : [' + value + ']');
                    process.exit(-1);
                }
                A.push(tuple[0]);
                AAAA.push(tuple[1]);
            });

            if (A.length === AAAA.length && A.length > 0) {
                record.A    = A;
                record.AAAA = AAAA;
            }
        }

        var redis = require('redisd').create($this.config);
        redis.connect(function () {
            redis.set($this.config.dns.prefix + key, JSON.stringify(record), function (err, value) {
                var successes = 0,
                    failures  = 0;

                function createArpa(keys) {
                    if (!keys || keys.length < 1) {
                        console.log(failures ?"FAIL":"OK");
                        redis.close();
                        return;
                    }
                    var key = keys.shift();
                    var arpa = key.split('.').reverse().join('.') + '.in-addr.arpa';
                    redis.set($this.config.dns.prefix + arpa, JSON.stringify(record), function (err, result) {
                        if (err) {
                            failures += 1;
                        } else {
                            successes += 1;
                        }
                        process.nextTick(function () {
                            createArpa(keys);
                        });
                    });
                }
                createArpa(record.A ? record.A.slice(0): []);
            });
        });
    };

    DnsCtl.prototype.del = function (key) {
        var $this = this;

        var redis = require('redisd').create($this.config);
        redis.connect(function () {
            if (key.indexOf('*') !== -1) {
                redis.keys($this.config.dns.prefix + key, function (err, values) {
                    var message = "";
                    function removeEntry(keys) {
                        if (!keys || keys.length < 1) {
                            console.log(message);
                            redis.close();
                            return;
                        }
                        var key = keys.shift();
                        redis.del(key, function (err, value) {
                            if (message.length > 0) message += ', ';
                            message += "" + key + ":" + (err ?"FAIL":"OK");
                            process.nextTick(function () {
                                removeEntry(keys);
                            });
                        });
                    }
                    removeEntry(values);
                });
            } else {
                redis.del($this.config.dns.prefix + key, function (err, value) {
                    console.log(err ?"FAIL":"OK");
                    redis.close();
                });
            }
        });
    };

    function create(config) {
        return new DnsCtl(config);
    }

    return {
        create : create
    };
}();
