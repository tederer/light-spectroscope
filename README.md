# light-spectroscope

This project implements a low cost light-spectroscope using the AS7265x sensors. It consists of the hardware described in the next chapter and a service to provide ...

* a user friendly web interface
* a REST interface to query the current values of the sensor
* a [Swagger UI](https://swagger.io/tools/swagger-ui/) to test the REST interface
* a [Prometheus](https://prometheus.io) interface to provide data to Prometheus

# hardware

The light-spectroscope consists of the following hardware components:

* SparkFun SEN-15050: Triad Spectroscopy Sensor - AS7265x (Qwiic)
* SparkFun DEV-14050: Serial Basic Breakout - CH340G

## Prerequisites

The following software is required to install and use the project.

* [Node.js](https://nodejs.org/en/download/)
* [Git](https://git-scm.com/download/win)

## Hardware installation/assembly

TODO: add some pictures here

## Installation

This section describes how to install the workshop project.

### Linux
1. execute `git clone https://github.com/tederer/light-spectroscope.git`
2. execute `cd light-spectroscope`
3. execute `npm install`
4. execute `npm run grunt`

### Windows
1. execute `git clone https://github.com/tederer/light-spectroscope.git`
2. close the command line box
3. start `light-spectroscope/openCliHere.bat` (info: a command line box will inform you that the home folder of grunt does not exist. That's ok ... just press any key to continue)
4. execute `npm install`
5. close the command line box
6. start `light-spectroscope/openCliHere.bat`
7. execute `grunt`

## Starting the service 

To start the service, the following steps need to get executed.

### Linux

1. in a terminal open the folder `light-spectroscope`
2. execute `npm start`

### Windows

1. start `light-spectroscope/openCliHere.bat`
2. execute `npm start`

## References

* [Spectral Triad (AS7265x) Hookup Guide ](https://learn.sparkfun.com/tutorials/spectral-triad-as7265x-hookup-guide)
* [Prometheus text based exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/)
* [About SerialPort | Node SerialPort](https://serialport.io/docs/)
* [Node.js (stream documentation)](https://nodejs.org/api/stream.html#stream)
* [Node.js (line based stream reading)](https://nodejs.org/api/readline.html#readline)