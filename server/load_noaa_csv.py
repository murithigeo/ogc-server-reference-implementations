import os
import subprocess
import pandas as pd
import psycopg2

folderPath=r"C:\Users\\bushie\\Downloads\\2025"

pconn= psycopg2.connect("user=postgres")
pconn.autocommit=True

cursor=pconn.cursor()
fileList=os.listdir(folderPath)
fileCount=fileList.__len__()

for file in fileList:
    if file.lower().endswith(".csv"):        
        file_path=os.path.join(folderPath,file)
        df= pd.read_csv(file_path)
        ##df.drop(df.index[16])
        df=df.iloc[:,:16]
        query= """INSERT INTO noaa_hourly_raw("STATION","DATE","SOURCE","LATITUDE","LONGITUDE","ELEVATION","NAME","REPORT_TYPE","CALL_SIGN","QUALITY_CONTROL","WND","CIG","VIS","TMP","DEW", "SLP")
              VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        values=[tuple(row) for row in df.itertuples(index=False,name=None)]
        cursor.executemany(query,values)
        os.remove(file_path,)
        fileCount=fileCount-1
        print(f"Loaded & deleted {file}; Remaining: {fileCount}")
cursor.close()
pconn.close()