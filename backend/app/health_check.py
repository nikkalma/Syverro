from urllib.request import urlopen
print(urlopen('http://localhost:8000/health').read().decode())