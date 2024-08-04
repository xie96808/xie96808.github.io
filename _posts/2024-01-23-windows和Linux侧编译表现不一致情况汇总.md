---
layout:     post   				    # 使用的布局（不需要改）
title:      C++Windows/Linux侧编译表现不一致问题汇总				# 标题 
subtitle:    #副标题
date:       2024-01-23 				# 时间
author:     谢玄xx 						# 作者
header-img: img/sea2.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 开发问题总结
---


## 1 背景介绍
  C++ 是一种广泛使用的编程语言，常用于开发应用程序、系统软件和嵌入式系统等领域。然而，在不同的操作系统（如Windows和Linux）上进行C++编译时，可能会出现表现不一致的问题。这些问题源于操作系统之间的差异，包括操作系统内核、系统调用、文件路径分隔符、标准库实现以及编译器本身的差异。这些差异可能导致在一个平台上正常工作的代码在另一个平台上出现错误或产生不一致的结果。
  总之，C++在不同操作系统上的编译存在着一些表现不一致的问题。了解和解决这些问题需要开发人员熟悉各个平台的差异，并采取相应的策略，例如使用条件编译、使用适配层或编写可移植的代码来确保在多个平台上具有一致的行为。
## 2 常见Linux编译不过问题类别
### 2.1 编译器选项差异
不同的编译器对于相同的C++代码可能采用不同的默认编译选项，例如警告级别、优化级别等，导致代码在不同平台上有不同的行为。

### 2.2 标准库差异
  尽管C++标准为跨平台开发提供了一致性，但不同的操作系统和编译器可能使用不同的标准库实现，导致在某些功能或特性上出现不一致性。
** floor/floorl相关函数
  在编译floor函数时，两平台表现一致，但在编译std::floorl时，Linux侧编译不过，报错'floorf' is not a member of 'std' ：
  
![image](https://github.com/user-attachments/assets/5a7afc1b-29b7-4c8a-b55b-a9f9c5383dc6)

解决方式一：std::floorf修改为::floorl。因为floorl()属于C标准库，所以在glibc中有一个全局符号。由于解决方法使用全局符号，C++11 允许但不要求存在，因此该解决方法不可移植。
解决方式二：引入<math.h> 头文件。Windows 上，floor() 和 floorl() 函数通常定义在 <cmath> 头文件中，而在 Linux 上，则通常定义在 <math.h> 头文件中。在使用这些函数之前，确保正确包含相应的头文件。

### 2.3 操作系统API差异
  操作系统提供的应用程序接口（API）在不同平台上可能有所不同，例如文件操作、网络通信、并发编程等。这可能导致代码在不同平台上产生不兼容或未定义的行为。
  

![image](https://github.com/user-attachments/assets/7cc1ba13-f674-462f-81e8-5d4d963ff6bc)


### 2.4 文件路径和分隔符差异
  Windows使用反斜杠（\）作为文件路径分隔符，而Linux使用正斜杠（/）。这在处理文件路径时可能导致问题，特别是在跨平台项目中。
### 2.5 跨节点并行异常返回表现差异
  在Windows操作系统中，异常处理通常依赖于结构化异常处理（Structured Exception Handling，SEH）机制。SEH允许开发者捕获和处理特定类型的异常，包括跨线程和跨进程的异常。当异常发生时，Windows会将其传递给相应的异常处理程序进行处理。因此，在跨节点并行环境下，Windows提供了较为灵活的异常处理机制，可以捕获和处理来自不同节点的异常返回。 
相比之下，Linux操作系统通常使用信号（signal）来处理异常。信号是一种软件中断，用于通知进程发生了某种事件或错误情况。在跨节点并行环境下，Linux可能需要依赖其他工具、库或技术来实现有效的异常返回和处理。这可能涉及到进程间通信（Inter-Process Communication，IPC）机制，如管道（pipe）、消息队列（message queue）或远程过程调用（Remote Procedure Call，RPC）等。 由于Windows和Linux在异常处理机制上的不同，跨节点并行异常返回在两个操作系统下的表现也会有所差异。
  本人实际开发的项目现在已经引入了跨节点并行技术(GLMPI, developed by Haida)。在需求实现过程中，常会出现某个进程报错退出，但其他进程并没有遇到异常退出信息，导致异常进程一直在等待其他进程结束从而导致软件crash的现象发生。在debug过程中我们发现，该现象在两个平台的表现存在差异。
Windows侧表现：  

![image](https://github.com/user-attachments/assets/95672502-ad34-4992-8917-dfe8bf4133ab)

Linux侧表现：  

![image](https://github.com/user-attachments/assets/e70915cf-a5c0-43d4-a9d1-430161c8bc6f)


### 2.6 左值右值差异
问题代码如下：  

![image](https://github.com/user-attachments/assets/09ee458e-ce00-4fc4-a277-5bd9f0bcbecd)

![image](https://github.com/user-attachments/assets/7a5b98d7-07cb-44de-8cc3-43bb3a6d8d39)

Windows侧无问题，但Linux编译时会报错：  

![image](https://github.com/user-attachments/assets/8785746c-1c0a-4c5a-a140-9896559a6e68)

问题原因：	
  当一个函数的形参为非const类型的引用，而该参数以非const传入，编译器一般会认为程序员会在该函数里修改该参数，而且该参数返回后还会发挥作用。此时如果把一个临时变量当成非const引用传进来，由于临时变量的特殊性，程序员无法对改临时变量进行操作，同时临时变量可能随时会消失，修改临时变量也毫无意义，因此，临时变量不能作为非const引用。
而const QString aaa对象调用toStdString()方法时，返回的是一个临时的std::string对象，也就是一个右值。这是因为toStdString()返回的是一个新的std::string对象，而不是一个对已有对象的引用。由于toStdString()返回的是右值，我们不能将它直接传递给接受左值引用（即std::string &path）的函数loadModelFile。左值引用要求传递的是一个可修改的左值，而不是一个临时的右值。Windows爸爸非常宽容，它允许我犯这种错误T^T
  解决方式：修改std::string &path参数为const std::string &path。这样就可以直接传递右值（如toStdString()的结果）给loadModelFile方法。这样修改之后，loadModelFile方法将接受std::string的常量引用，可以避免临时对象的复制，并且允许传递右值。
## 3 其他
### 3.1 Qt界面和命令行表现差异
在命令行中，\t 会被解析为制表符，而Qt 界面的文本显示控件不会自动解析\t为制表符。
代码如下：  

![image](https://github.com/user-attachments/assets/796b52e4-e0c9-485e-a381-6b7bf65ecd76)

命令行表现：  

![image](https://github.com/user-attachments/assets/7ab9a04d-4819-4326-8bd3-02b5b272e84e)

界面表现：  

![image](https://github.com/user-attachments/assets/af2adb5b-3bef-46d6-8cf7-4c6f81566c8d)



