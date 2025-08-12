package test.apidemo.activity;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import com.ctk.sdk.PosApiHelper;

/**
 * Created by Administrator on 2017/8/17.
 */

public class PciActivity extends Activity {

    public static final int OPCODE_DUKPT_LOAD = 3;
    public static final int OPCODE_GET_DUKPTDES = 4;
    public static final int OPCODE_GET_RAND = 5;
    public static final int OPCODE_MK = 6;
    public static final int OPCODE_MKSKDES = 7;


    private final String tag = "PciActivity";

    private ReadWriteRunnable _runnable;

    TextView textView = null;

    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_pci);

        this.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        textView = (TextView) findViewById(R.id.textView_pci);
        textView.setMovementMethod(new ScrollingMovementMethod());
        SendMsg("Please click \"Dukpt_Load\" to load the key ", 0);
    }


    public void OnClickDukptLoad(View view) {
        if (_runnable != null && _runnable.IsThreadFinished() == false) {
            Log.e("", "Thread is still running, return...");
            return;
        }
        _runnable = new ReadWriteRunnable(OPCODE_DUKPT_LOAD);
        Thread requestThread = new Thread(_runnable);
        requestThread.start();
        Log.i(tag, "OnClickDukptLoad");
    }

    public void OnClickGetDes(View view) {
        if (_runnable != null && _runnable.IsThreadFinished() == false) {
            Log.e("", "Thread is still running, return...");
            Log.e(tag, "----------Thread is still running, return...");
            return;
        }
        _runnable = new ReadWriteRunnable(OPCODE_GET_DUKPTDES);
        Thread requestThread = new Thread(_runnable);
        requestThread.start();
        Log.i(tag, "OnClickGetDes");
    }


    public void OnClickGetRand(View view) {
        if (_runnable != null && _runnable.IsThreadFinished() == false) {
            Log.e("", "Thread is still running, return...");
            return;
        }

        _runnable = new ReadWriteRunnable(OPCODE_GET_RAND);
        Thread requestThread = new Thread(_runnable);
        requestThread.start();
        Log.i(tag, "OnClickGetRand");
    }

    public void OnClickW_MK(View view) {
        if (_runnable != null && _runnable.IsThreadFinished() == false) {
            Log.e("", "Thread is still running, return...");
            return;
        }

        _runnable = new ReadWriteRunnable(OPCODE_MK);
        Thread requestThread = new Thread(_runnable);
        requestThread.start();
        Log.i(tag, "OnClickW_MK");
    }

    public void OnClickW_MKTEST(View view) {
        if (_runnable != null && _runnable.IsThreadFinished() == false) {
            Log.e("", "Thread is still running, return...");
            return;
        }

        _runnable = new ReadWriteRunnable(OPCODE_MKSKDES);
        Thread requestThread = new Thread(_runnable);
        requestThread.start();
        Log.i(tag, "OnClickW_MKTEST");
    }



    public int IO_Switch( int on) {

        int ret = 0;
        final String MCU_POWER_PATCH = "/sys/devices/platform/mcu_power/mcu_power_pwren";

        String str = String.valueOf(1);
        try {
            FileOutputStream fps = new FileOutputStream(new File(MCU_POWER_PATCH));
            fps.write(str.getBytes());
            fps.close();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            Log.d("mylog", "exception : " + e);
        }

        return  0;
    }


    private class ReadWriteRunnable implements Runnable {

        private int mOpCode, ret;
        byte[] keyData = null;
        byte[] key_kcv = null;
        boolean isThreadFinished = false;

        public boolean IsThreadFinished() {
            return isThreadFinished;
        }

        //构造函数 带一个参数
        public ReadWriteRunnable(int OpCode) {
            mOpCode = OpCode;
        }

        @Override
        public void run() {
            isThreadFinished = false;

            switch (mOpCode) {

                case OPCODE_DUKPT_LOAD:
                    int  KsnLen, KeyIdDATA, KeyIdPIN;
                    Log.e("Robert", "dukpt test0");
                    final  byte[] DATAIPEK = StringUtil.hexStringToBytes("8A861B8B13AD8F449AB521E127EDDDD6");
                    final  byte[] PINIPEK = StringUtil.hexStringToBytes("8A861B8B13AD8F449AB521E127EDDDD6");
                    final  byte[] KSNDATA = StringUtil.hexStringToBytes("FFFF0705160000000336");
                    final  byte[] KSNPIN = StringUtil.hexStringToBytes("FFFF0705160000000336");

                    KsnLen = KSNDATA.length;
                    ret = 0;

                    KeyIdDATA = 1;
                    ret |= posApiHelper.PciWriteDukptIpek( KeyIdDATA, PINIPEK.length, PINIPEK, KsnLen, KSNDATA);

                    KeyIdPIN = 2;
                    ret |= posApiHelper.PciWriteDukptIpek( KeyIdPIN, DATAIPEK.length, DATAIPEK, KsnLen, KSNPIN);
                    SendMsg("Key successfully loaded = " + ret, 0);
                    break;

                case OPCODE_GET_DUKPTDES:
                    int  KeyId;
                    byte mode, DesMode;
                    KeyId = 1;
                    mode = 1;
                    DesMode = 0;
                    final byte[] Des_data_in =  StringUtil.hexStringToBytes("1234567812345678");
                    final byte[] IV =  StringUtil.hexStringToBytes("0000000000000000");
                    final byte[] Des_Out= new byte[512];
                    final byte[] OutKsn = new byte[10];
                    final byte[] Des_Kcv = new byte[3];
                    byte Des_data_len = 8;
                    ret = posApiHelper.PciGetDuktDes(KeyId, mode, DesMode, Des_data_len,  Des_data_in, IV, Des_Out, OutKsn, Des_Kcv);
                    Log.i(tag, "------OPCODE_GET_DUKPTDes----end---------");
                    if(ret == 0)
                    {
                        SendMsg("Out:" +ByteUtil.bytearrayToHexString(Des_Out, Des_data_len) +
                                "\nKsn:"+ByteUtil.bytearrayToHexString(OutKsn, OutKsn.length), 0);
                        Log.e("dukpt", "PciGetDukptDes Des_Out- "+ByteUtil.bytearrayToHexString(Des_Out, Des_Out.length));
                        Log.e("dukpt", "PciGetDukptDes OutKsn - "+ByteUtil.bytearrayToHexString(OutKsn, OutKsn.length));
                    }
                    else
                    {
                        SendMsg("fail ret = "+ ret,0);
                    }
                    break;

                case OPCODE_GET_RAND:
                    byte[] randbuf = new byte[10];
                    posApiHelper.SysGetRand(randbuf);
                    SendMsg("rand - " + ByteUtil.bytearrayToHexString(randbuf, 8), 0);
                    break;

                /*MKSK--------------------------------------------*/
                case OPCODE_MK:
                    int ret = 0;
                    final  byte[] MK_KEY = StringUtil.hexStringToBytes("11223344556677881122334455667788");
                    final  byte[] SK_DES_KEY = StringUtil.hexStringToBytes("11223344556677881122334455667788");
                    final  byte[] SK_PIN_KEY = StringUtil.hexStringToBytes("11223344556677881122334455667788");
                    final  byte[] SK_MAC_KEY = StringUtil.hexStringToBytes("11223344556677881122334455667788");

                    ret |= posApiHelper.PciWritePinMKey((byte)0,(byte)16,MK_KEY,(byte)0);
                    ret |= posApiHelper.PciWriteDesMKey((byte)0,(byte)16,MK_KEY,(byte)0);
                    ret |= posApiHelper.PciWriteMacMKey((byte)0,(byte)16,MK_KEY,(byte)0);

                    ret |= posApiHelper.PciWriteDesKey((byte)0,(byte)16,SK_DES_KEY,(byte)0,(byte)0);
                    ret |= posApiHelper.PciWritePinKey((byte)0,(byte)16,SK_PIN_KEY,(byte)0,(byte)0);
                    ret |= posApiHelper.PciWriteMacKey((byte)0,(byte)16,SK_MAC_KEY,(byte)0,(byte)0);
                    SendMsg("MKSK key - " + ret , 0);
                    break;

                case OPCODE_MKSKDES:
                    byte[] TEST_IN_ = StringUtil.hexStringToBytes("11223344556677881122334455667788");
                    byte[] TEST_Out = new byte[512];
                    ret = 0;
                    ret |= posApiHelper.PciGetDes((byte)0,(byte)16,TEST_IN_,TEST_Out,(byte)1);
                    SendMsg("MKSK = " + ret + ", Out: " + ByteUtil.bytearrayToHexString(TEST_Out, 16), 0);
                    break;


                default:
                    break;
            }

            isThreadFinished = true;
        }
    }

    /*view-------------*/
    public void SendMsg(String strInfo, int what) {
        Message msg = new Message();
        msg.what = what;
        Bundle b = new Bundle();
        b.putString("MSG", strInfo);
        msg.setData(b);
        handler.sendMessage(msg);
    }

    private Handler handler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            Bundle b = msg.getData();
            String strInfo = b.getString("MSG");
            Log.i(tag, "----------------------strInfo : " + strInfo);
            if (msg.what == 0) {
                textView.setText(strInfo);
            } else {
                textView.setText(textView.getText() + "\n" + strInfo);
            }
            Log.i(tag, strInfo);
        }
    };
}
