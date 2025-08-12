package test.apidemo.service;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

import android.util.Log;

import androidx.annotation.Nullable;

import com.ctk.sdk.PosApiHelper;
import com.google.zxing.BarcodeFormat;


/**
 * Created by Administrator on 2018/1/17.
 */

public class MyService extends Service {

    public static final String tag = MyService.class.getSimpleName();

    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    //服务创建
    @Override
    public void onCreate() {
        super.onCreate();
    }

    // 服务启动
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        new Thread(new Runnable() {
            @Override
            public void run() {

//                Message msg = Message.obtain();
//                Message msg1 = Message.obtain();
//
//                msg.what = DISABLE_RG;
//                handler.sendMessage(msg);

                int ret = posApiHelper.PrintInit(2, 24, 24, 0x33);
                /*
                *  or
                *  No parameter defaults Api
                 */

                /*
                try {
                    ret= posApiHelper.PrintInit();
                } catch (PrintInitException e) {
                    e.printStackTrace();
                    int initRet = e.getExceptionCode();
                    Log.e(TAG,"initRer : "+initRet);
                }
                */

                if (ret != 0) {
                    return;
                }
                posApiHelper.PrintStr("Print Tile\n");
                posApiHelper.PrintStr("\n");
//                ret = posApiHelper.PrintSetFont((byte)24, (byte)24, (byte)0);
                ret = posApiHelper.PrintSetFont((byte) 16, (byte) 16, (byte) 0x33);

                Log.e(tag, "initRer PrintSetFont: " + ret);

                if (ret != 0) {
                    return;
                }
                posApiHelper.PrintStr("- - - - - - - - - - - - - - - - - - - - - - - -\n");
                //	posApiHelper.PrintStr("\n");
                posApiHelper.PrintStr("  Print Str1 \n");
                posApiHelper.PrintStr("  Print Str2 \n");
               posApiHelper.PrintBarcode("123456789", 360, 120, "CODE_128");
                posApiHelper.PrintBarcode("123456789", 240, 240, "QR_CODE");
                posApiHelper.PrintStr("CODE_128 : " + "123456789" + "\n\n");
                posApiHelper.PrintStr("QR_CODE : " + "123456789" + "\n\n");
                posApiHelper.PrintStr("asdadasdasdasdasd\n\n");
                posApiHelper.PrintStr("1234567890\n\n");
                posApiHelper.PrintStr("                                        \n");
                posApiHelper.PrintStr("\n");
                posApiHelper.PrintStr("\n");


//                SendMsg("Printing... ");
//                callBackPrintStatus.printStatusChange("Printing... ");

                Log.e(tag, "Printing... ");

//                ret = posApiHelper.PrintCheckStatus();
//
//                Log.e(tag, "PrintCheckStatus 1 ret = " + ret);

                ret = posApiHelper.PrintStart();

//                ret = posApiHelper.PrintCheckStatus();
//
//
//                Log.e(tag, "PrintCheckStatus 2 ret = " + ret);


                Log.e(tag, "Lib_PrnStart ret = " + ret);

//                msg1.what = ENABLE_RG;
//                handler.sendMessage(msg1);

                if (ret != 0) {

//                    RESULT_CODE = -1;
                    Log.e(tag, "Lib_PrnStart fail, ret = " + ret);

                    if (ret == -1) {
//                        SendMsg("No Print Paper ");
                        Log.e(tag, "No Print Paper ");
//                        callBackPrintStatus.printStatusChange("No Print Paper ");

                    } else {
                        Log.e(tag, "Print fail");
//                        callBackPrintStatus.printStatusChange("Print fail");

//                        SendMsg("Print fail ");
                    }
//                    if(ret==-2)
//                    {
//                        SendMsg("The temperature is too high ");
//                    }
//                    if(ret==-3)
//                    {
//                        SendMsg("The voltage is too low");
//                    }
//
//                    SendMsg("Print Fail ");
                } else {
//                    RESULT_CODE = 0;
//                    SendMsg("Print Finish ");
                    Log.e(tag, "Print Finish ");
//                    callBackPrintStatus.printStatusChange("Print Finish ");


                }
            }
        }).start();

        return super.onStartCommand(intent, flags, startId);
    }

    //服务销毁
    @Override
    public void onDestroy() {
        stopSelf(); //自杀服务
        super.onDestroy();
    }

    //绑定服务
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return new MyBinder();
    }

    // IBinder是远程对象的基本接口，是为高性能而设计的轻量级远程调用机制的核心部分。但它不仅用于远程
    // 调用，也用于进程内调用。这个接口定义了与远程对象交互的协议。
    // 不要直接实现这个接口，而应该从Binder派生。
    // Binder类已实现了IBinder接口
//    class MyBinder extends MyBinder {
//        /**
//         * 获取Service的方法 * @return 返回Service
//         */
//        public MyService getService() {
//            return MyService.this;
//        }
//    }

    public class MyBinder extends android.os.Binder {
        public MyService getService() {
            return MyService.this;
        }
    }

    CallBackPrintStatus callBackPrintStatus;

    public interface CallBackPrintStatus {
        void printStatusChange(String strStatus);
    }

    public void setCallback(CallBackPrintStatus callback) {
        this.callBackPrintStatus = callback;
    }

}
