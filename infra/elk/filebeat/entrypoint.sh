#!/bin/sh
set -e

# If a host-provided config was mounted, copy it into place and ensure root ownership.
if [ -f "/tmp/filebeat-host.yml" ]; then
  cp /tmp/filebeat-host.yml /usr/share/filebeat/filebeat.yml
  chown root:root /usr/share/filebeat/filebeat.yml || true
fi

# Execute filebeat with the expected config path
exec filebeat -e -c /usr/share/filebeat/filebeat.yml "$@"
