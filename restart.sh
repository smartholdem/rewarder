forever stop bin/www >&- 2>&-
forever stop worker.js >&- 2>&-
forever start bin/www
forever start worker.js
