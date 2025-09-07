---
layout:     post   				    # 使用的布局（不需要改）
title:      Calibrator模块重构文档				# 标题 
subtitle:    #副标题
date:       2025-06-28 				# 时间
author:     谢玄xx 						# 作者
header-img: img/sea1.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 重构
---

## 1 开发背景   
在我司的EDA产品矩阵中，本人正参与开发的软件（后文称为A软件）正在扮演越来越重要的角色。虽然用于检测成品芯片热点缺陷的后段校准器已在多家厂商开始试用，但前中段工艺流程在芯片制造环节中仍然至关重要。因此有必要开发A软件的前中段校准器，形成完成的前-中-后段工艺全流程仿真工具。
## 2 涉及修改的主要模块  
由于之前开发后段模块时，做了很多特殊场景的判断，因此前段校准器模块的改动具有相当的工作量。  
### 2.0 CLBPredictorAdaptor  
开发后段校准器时，所采用的设计模式(适配器模式，Adaptor Mode)在架构设计时未考虑模块的可扩展性，因此该模式需要进行调整和重构。  
之前的代码逻辑：  
  
```cpp
PredictorStatus CCLBPredictorAdaptor::processCommands()
{
    m_status = CBEOLPredictor::processCommands(); //跳转至后段仿真器的入口指令，执行BEOL Predictor Service
    if (m_status == PredictorStatus::PRDOk)
    CPGridDataHandler* _handler = getGridHandler();
    m_initGridHandler = new CPGridDataHandler(*_handler);
    return m_status;
}
```
     
可以看到，Adaptor数据类完全依赖后段仿真器数据类BEOLPredictor，没有可扩展性：  
![](https://raw.githubusercontent.com/xie96808/xie96808.github.io/master/img/2025-06-28-Calibrator模块重构文档_1.png)   
随着FEOLPredictor类的创建与投入使用，需要根据CCalibrator传入的Process Mode判断当前的工艺流程（前段/中段/后段/ET），不同mode执行不同流程的仿真器。现引入装饰器模式，修改结构如下：  
![](https://raw.githubusercontent.com/xie96808/xie96808.github.io/master/img/2025-06-28-Calibrator模块重构文档_2.png)    
为实现上述功能，在CLBPredictorAdaptor类中引入仿真适配器CPredictor* m_adoptor，在构造函数中即根据processMode指向不同的Predictor子类（CBEOLPredictor/CBEOLPredictorErosionTable/CFEOLPredictor/CFEOLPredictorErosionTable/CMOLPredictor）:  
```cpp  
class CCLBPredictorAdaptor  
{

public:
    CCLBPredictorAdaptor(bool calibraton_flag, int predictorType);
    
    if (predictorType == 0)
    {        
        m_adoptor = new CBEOLPredictor();
    }
    else if(predictorType == 2)
    {
        m_adoptor = new CFEOLPredictor();
    }
    else
    {
        // MOL
    }
    setProcessType(predictorType);
    m_adoptor->setCalibrationMode(calibraton_flag);
private:
    CPGridDataHandler *m_initGridHandler = nullptr; //每次校准前一次模型仿真的全部grid数据指针
    CPredictor *m_adoptor; //Predictor适配器
    int m_prdType;	// 工艺流程Process Type。0--BEOL 1--MOL 2--FEOL
}
```

同时需要重写CLBPredictorAdaptor数据类，原有方法全部移至CPredictor基类，Adaptor数据类中的函数全部用适配器m_adoptor灵活调用，如：
```cpp
void CCLBPredictorAdaptor::createCalculationUnit()
{
    m_adoptor->createCalculationUnit();
}

void CCLBPredictorAdaptor::createCalculationUnits()
{
    m_adoptor->createCalculationUnits();
}
```

## 3 UML图
![](https://raw.githubusercontent.com/xie96808/xie96808.github.io/master/img/2025-06-28-Calibrator模块重构文档_3.png)  
