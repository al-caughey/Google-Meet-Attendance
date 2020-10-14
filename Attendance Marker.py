#attendance_file is the source file and list_file is the destination file
__author__ = "Vallisha M"
__version__ = '0.0.0'

from os import listdir
from os.path import isfile, join
import tkinter as tk
import pandas as pd
import re

from tkinter import *
from tkinter import filedialog
from tkinter.filedialog import askopenfile

threshold = 20 #Minimum time of attendance to be marked present

root=Tk()

def attendance_marker(attendance_file_path, list_file_path):#Core Function
    pd.set_option('display.max_colwidth', 1000)
    file  = pd.read_csv(attendance_file_path)
    file.drop(file.index[0])
    names  = re.findall('([A-Za-z]+.*)', file.to_string())
    date = re.findall("[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]", names[0])[0]#getting date on which the lecture was delivered
    names.remove(names[0])
    durations = [] #stores duration of each duration of attendance (read README file to understand)
    for item in names:
        x = re.findall('\((\S+)min\)', item)
        if(len(x)>0):
            durations.append(x)
    duration = []#stores the net duration of attnedance of each student
    for i in range(len(durations)):
        duration.append(0)
        for j in range(len(durations[i])):
            duration[i] = duration[i]+int(float(durations[i][j]))
    for i in range(len(names)):
        index = names[i].find('\\')
        names[i] = names[i][0:index]
    names.remove(names[0])
    #Feature 4 implemented (see README file)
    for i in range(len(names)):
        for j in range(len(names[i])):
            if ((names[i][j] == ' ') and (names[i][0:j] == names[i][j+1:len(names[i][j])])):
                names[i] = names[i][0:j]
    #Changing date to DD-MM-YYYY format
    elements = re.findall("([0-9]+)", date)
    date = elements[2]+'-'+elements[1]+'-'+elements[0]
    slist = pd.read_excel(list_file_path)
    nameList = pd.DataFrame(slist, columns= ['Name'])
    attendance_list = []
    for row_index, row in nameList.iterrows():
        attendance_list.append(re.findall('Name    (\S+.*)', row.to_string())[0])

    numbers_list = []#0 or 1 to be marked
    l = len(duration)
    i = 0
    #feature 3 implemented
    while(i<l):
        if(duration[i]<threshold):
            names.remove(names[i])
            duration.remove(duration[i])
            l = l-1
        else:
            i = i+1
    for i in range(len(attendance_list)):
        status = 0
        for j in range(len(names)):
            if(attendance_list[i].casefold() == names[j].casefold()):
                status = 1
                break
        numbers_list.append(status)
    slist[date] = numbers_list
    writer = pd.ExcelWriter(list_file_path)
    slist.to_excel(writer, index = False) #Writing to destination file
    # save the excel
    writer.save()
    writer.close()

def file_submit():#Implements feature 1(see README file)
    pd.set_option('display.max_colwidth', 1000)
    file = askopenfile(mode ='r', filetypes =[('Attendance File(csv)', '*.csv')])#Getting souce file
    attendance_file_path = re.findall('\'(.+\.csv)\'', str(file))[0]#Getting souce file path
    canvas.pack()
    file1 = askopenfile(mode ='r', filetypes =[('Class list File(xlsx)', '*.xlsx')])#Getting destination file
    list_file_path = re.findall('\'(.+\.xlsx)\'', str(file1))[0]#Getting destination file path
    attendance_marker(attendance_file_path, list_file_path)

    print("Done")
    canvas.create_text(310, 280, font = ("Purisa", 13), text = "DONE", fill = 'black')
    canvas.create_text(310, 310, font = ("Purisa", 13), text = "You may quit now.", fill = 'black')
    canvas.create_text(310, 330, font = ("Purisa", 13), text = "or", fill = 'black')
    canvas.create_text(310, 350, font = ("Purisa", 13), text = "Continue by clicking one of the buttons again.", fill = 'black')

def folder_submit():#Implements feature 2(see README file)
    mypath = filedialog.askdirectory()#Getting destination folder
    onlyfiles = [f for f in listdir(mypath) if isfile(join(mypath, f))]
    files = []# stores path of each source fle in the folder
    for item in onlyfiles:
        if(item[-3:] == 'csv'):# only csv files in the selected folder will be considered
            files.append(mypath+'\\'+item)
    file1 = askopenfile(mode ='r', filetypes =[('Class list File(xlsx)', '*.xlsx')])#Getting destination file
    list_file_path = re.findall('\'(.+\.xlsx)\'', str(file1))[0]#Getting destination file(Only xcel files) path
    pd.set_option('display.max_colwidth', 1000)
    for attendance_file_path in files:
        attendance_marker(attendance_file_path, list_file_path)
    print("Done")
    canvas.create_text(310, 280, font = ("Purisa", 13), text = "DONE", fill = 'black')
    canvas.create_text(310, 310, font = ("Purisa", 13), text = "You may quit now.", fill = 'black')
    canvas.create_text(310, 330, font = ("Purisa", 13), text = "or", fill = 'black')
    canvas.create_text(310, 350, font = ("Purisa", 13), text = "Continue by clicking one of the buttons again.", fill = 'black')



# creating a label for
# name using widget Label
root.wm_title("Attendance Marker")

canvas=Canvas(root,width=600,height=400)


canvas.create_image(0, 0,anchor=NW)
canvas.create_text(580, 390, font = ("Purisa", 9), text = 'v'+__version__, fill = 'blue')
canvas.create_text(300, 100, font = ("Purisa", 20), text = "Attendance Marker", fill = 'black')
canvas.create_text(310, 200, font = ("Purisa", 12), text = "Click on one of the buttons to continue", fill = 'black')

canvas.create_text(300, 390, font = ("Purisa", 10), text = "Make sure you have attendance and class list files closed while using Attendance Marker.\n", fill = 'black')

button1 = Button(text = "File", command = file_submit)
button1.configure(width = 10,background = 'gray', activebackground = "#33B5E5", relief = RAISED)
button1_window = canvas.create_window(200, 220, anchor=NW, window=button1)

button2 = Button(text = "Folder", command = folder_submit)
button2.configure(width = 10,background = 'gray', activebackground = "#33B5E5", relief = RAISED)
button2_window = canvas.create_window(340, 220, anchor=NW, window=button2)

canvas.pack()
root.mainloop()
