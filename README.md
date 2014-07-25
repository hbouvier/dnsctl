[![Build Status](https://travis-ci.org/hbouvier/dnsctl.png)](https://travis-ci.org/hbouvier/dnsctl)
[![dependency Status](https://david-dm.org/hbouvier/dnsctl/status.png?theme=shields.io)](https://david-dm.org/hbouvier/dnsctl#info=dependencies)
[![devDependency Status](https://david-dm.org/hbouvier/dnsctl/dev-status.png?theme=shields.io)](https://david-dm.org/hbouvier/dnsctl#info=devDependencies)
[![NPM version](https://badge.fury.io/js/dnsctl.png)](http://badge.fury.io/js/dnsctl)

dnsctl
===

A dns client to manipulate host configuration on the dns server.

## Installation


    sudo npm install -g dnsctl

## REDIS CONFIGURATION

	REDIS_URLS  (default: 127.0.0.1:6379)

## Usage

### Version

    dnsctl version

### set

    dnsctl set example.com 192.168.1.1,2605:f8b0:4006:802:0:0:0:1010 192.168.1.2,2605:f8b0:4006:802:0:0:0:1011

### get

    dnsctl get example.com

### del

    dnsctl del example.com