#!/bin/bash
# --exclude='*.map'

tar --exclude='./node_modules' --exclude='./.vscode' --exclude='./relkub.sh' \
 --exclude='./media.tar.gz' --exclude='./.git' \
 -zcvf media.tar.gz . 

CMD=$(cat <<-END
set -x
cd /data/apps/media
tar zxvf ./media.tar.gz -C .
npm i
#node app.js
#forever stop app.js
#forever start app.js
END
)

scp ./media.tar.gz kub:/data/apps/media/
ssh kub "$CMD"