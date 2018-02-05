#!/usr/bin/env bash

TEMP=`getopt -o d --long debug,remove-dead-orders,can-clear-book,nodemon -- "$@"`
eval set -- "$TEMP"

NODE_EXECUTABLE='node'
REMOVE_DEAD=''
DEBUG_STR=''
CLEAR_BOOK=''

# extract options and their arguments into variables.
while true ; do
    case "$1" in
        -d|--debug) DEBUG_STR="--inspect-brk=0.0.0.0:9000" ; shift ;;
        --remove-dead-orders) REMOVE_DEAD='--remove-dead-orders' ; shift ;;
        --can-clear-book) CLEAR_BOOK='--can-clear-book' ; shift ;;
        --nodemon) NODE_EXECUTABLE='nodemon -L' ; shift ;;
        --) shift ; break ;;
        *) echo "Internal error!" ; exit 1 ;;
    esac
done

echo "Remove dead orders: $REMOVE_DEAD"
echo "Can clear book: $CLEAR_BOOK"
echo "Debug options: $DEBUG_STR"
echo "Node executable: $NODE_EXECUTABLE"
$NODE_EXECUTABLE $DEBUG_STR app/server.js $REMOVE_DEAD $CLEAR_BOOK