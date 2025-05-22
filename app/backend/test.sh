#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Running: npm run test"
  npm run test 2>&1 | tee test.log
else
  echo "Running: npm run test $@"
  npm run test "$@" 2>&1 | tee test.log
fi

echo "Test completed. Check test.log for details."