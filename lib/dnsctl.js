module.exports = function () {

    function DnsCtl(config) {
        var $this = this;
        this.config  = config;
        this.meta    = config.meta;
        this.version = config.version;
        this.logger  = config.logger;
        this.rest    = require('./rest').create(config);
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
            case "help":
                console.log("USAGE: dnsctl [get <hostname> | del <hostname> | set <hostname> <ipv4,ipv6> {<ipv4,ipv6> ...}");
                break;
            default:
                console.log("Unknow command ", options.args[0]);
                break;
        }
    };

    DnsCtl.prototype.get = function (key) {
        var $this = this;
        $this.rest.get(key, function (err, values) {
            console.log(err ? err : values);
        });
    };

    DnsCtl.prototype.set = function (key, values) {
        var $this  = this,
            record = {
            };
        if (values && values.length) {
            var ipv4 = [],
                ipv6 = [];

            values.forEach(function (value) {
                var tuple = value.split(',');
                if (tuple.length !== 2) {
                    console.log('ERROR: You must specify an IPv4,IPv6 pair (e.g. 192.168.1.1,1:2:3:4:5:6:7:8) without any spaces. Got : [' + value + ']');
                    process.exit(-1);
                }
                ipv4.push(tuple[0]);
                ipv6.push(tuple[1]);
            });

            if (ipv4.length === ipv6.length && ipv4.length > 0) {
                record.ipv4 = ipv4;
                record.ipv6 = ipv6;
            }
        }
        console.log(record)
        $this.rest.put(key, record, function (err, value) {
            var successes = 0,
                failures  = 0;

            function createArpa(keys) {
                if (!keys || keys.length < 1) {
                    console.log(failures ?"FAIL":"OK");
                    return;
                }
                var key = keys.shift();
                var arpa = key.split('.').reverse().join('.') + '.in-addr.arpa';
                $this.rest.put(arpa, record, function (err, result) {
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
            createArpa(record.A ? record.A instanceof(Array) ? record.A.slice(0) : [record.A] : []);
        });
    };

    DnsCtl.prototype.del = function (key) {
        var $this = this;

        $this.rest.delete(key, function (err) {
            console.log(err ? "FAIL" : "OK");
        });
    };



    function create(config) {
        return new DnsCtl(config);
    }

    return {
        create : create
    };
}();
