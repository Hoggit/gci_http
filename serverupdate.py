import socket
import time
import logging

while True:
	with open('serverstate.json') as f:
		try:
			serverstate = str.encode(f.read() + "\n")
			conn = socket.create_connection(("status.hoggitworld.com", 29587))
			conn.send(serverstate)
			conn.close()
		except Exception as e:
			logging.error(traceback.format_exc())
			# Logs the error appropriately. 
    
	time.sleep(20)
