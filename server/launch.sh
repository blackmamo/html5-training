#!/usr/bin/env bash

TEMP=`getopt -o d --long debug,remove-dead-orders -- "$@"`
eval set -- "$TEMP"

REMOVE_DEAD='false'
DEBUG_STR=''

# extract options and their arguments into variables.
while true ; do
    case "$1" in
        -d|--debug) DEBUG_STR="--inspect-brk=0.0.0.0:9000" ; shift ;;
        --remove-dead-orders) REMOVE_DEAD='true' ; shift ;;
        --) shift ; break ;;
        *) echo "Internal error!" ; exit 1 ;;
    esac
done

echo "Remove dead orders: $REMOVE_DEAD"
echo "Debug options: $DEBUG_STR"
nodemon $DEBUG_STR app/server.js $REMOVE_DEAD