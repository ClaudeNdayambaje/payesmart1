package test.apidemo.activity;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.Message;

import com.ctk.sdk.PosApiHelper;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;


/**
 * Created by Administrator on 2021/03/17.
 */


public class IccActivity extends Activity implements View.OnClickListener {

    private final String TAG = "IccActivity";
    private boolean isIccChecked = false;
    private boolean isPsam1Checked =false;
    private boolean isPsam2Checked =false;

    private RadioGroup cardTypeRadioGroup = null;
    private RadioButton radioButtonIccCard = null;
    private RadioButton radioButtonPsam1 = null;
    private RadioButton radioButtonPsam2 = null;
    private Button TestButton = null;

    private byte ATR[] = new byte[40];
    private byte vcc_mode = 1;
    private int ret;

    private WorkHandler mWorkHandler;
    private HandlerThread mWorkThread;

    TextView tv_msg = null;
    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    private static byte CARD_SLOT_ICC = 0;
    private static byte CARD_SLOT_PSAM1 = 1;
    private static byte CARD_SLOT_PSAM2 = 2;

    private class WorkHandler extends Handler {
        public static final int MSG_WORK_ICCARD_ACTION = 1 << 0;
        public static final int MSG_WORK_PSAM1_ACTION = 1 << 1;
        public static final int MSG_WORK_PSAM2_ACTION = 1 << 2;

        public WorkHandler(Looper looper) {
            super(looper);
        }

        @Override
        public void handleMessage(Message msg) {
            int what = msg.what;
            switch (what) {
                case MSG_WORK_ICCARD_ACTION:
                    startTestIcc(CARD_SLOT_ICC);
                    break;
                case MSG_WORK_PSAM1_ACTION:
                    startTestIcc(CARD_SLOT_PSAM1);
                    break;
                case MSG_WORK_PSAM2_ACTION:
                    startTestIcc(CARD_SLOT_PSAM2);
                    break;
                default:
                    break;
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams. FLAG_FULLSCREEN ,
                WindowManager.LayoutParams. FLAG_FULLSCREEN);

        setContentView(R.layout.activity_icc);

        cardTypeRadioGroup = (RadioGroup) this.findViewById(R.id.rg_card_type);
        cardTypeRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            public void onCheckedChanged(RadioGroup radioGroup, int checkedId) {
                switch (checkedId) {
                    case R.id.radioButton_icc:
                        tv_msg.setText("IC card Checked");
                        isIccChecked = true;
                        isPsam1Checked = false;
                        isPsam2Checked = false;
                        break;
                    case R.id.RadioButton_psam1:
                        tv_msg.setText("Psam1 Checked");
                        isIccChecked = false;
                        isPsam1Checked = true;
                        isPsam2Checked = true;
                        break;
                    case R.id.RadioButton_psam2:
                        tv_msg.setText("Psam2 Checked");
                        isIccChecked = false;
                        isPsam1Checked = false;
                        isPsam2Checked = true;
                        break;

                }
            }
        });

        tv_msg = (TextView) this.findViewById(R.id.tv_msg);

        TestButton = (Button) findViewById(R.id.button_SingleTest);
        TestButton.setOnClickListener(IccActivity.this);

        radioButtonIccCard = (RadioButton) findViewById(R.id.radioButton_icc);
        radioButtonIccCard.setChecked(true);
        isIccChecked = true;

        //star a thread for psam action
        mWorkThread = new HandlerThread("sdk_psam_thread");
        mWorkThread.start();
        mWorkHandler = new WorkHandler(mWorkThread.getLooper());


    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mWorkHandler.removeCallbacksAndMessages(null);
        mWorkThread.quitSafely();

    }


    String strInfo = "";
    void startTestIcc(byte slot) {
        ret = 1;
        byte dataIn[] = new byte[512];

        if (slot == 0) {
            ret = posApiHelper.IccCheck(slot);
            if (ret != 0) {
                runOnUiThread(new Runnable() {
                    public void run() {
                        tv_msg.setText("CPU Check Failed");
                    }
                });

                return ;
            }
        }

        ret = posApiHelper.IccOpen(slot, vcc_mode, ATR);
        if (ret != 0) {
            runOnUiThread(new Runnable() {
                public void run() {
                    tv_msg.setText("Open Failed");
                }
            });
            Log.e(TAG, "IccOpen failed!");
            return;
        }

        String atrString = "";
        for (int i = 0; i < ATR.length; i++) {
            atrString += Integer.toHexString(Integer.valueOf(String.valueOf(ATR[i]))).replaceAll("f", "");
        }
//        Log.d(TAG, "atrString = " + atrString);
        Log.d(TAG, "atrString = " + ByteUtil.bytearrayToHexString(ATR, ATR.length));

        byte cmd[] = new byte[4];
        short lc = 0;
        short le = 0;

        if (slot == 0) {
            cmd[0] = (byte) 0x00;   //0-3 cmd
            cmd[1] = (byte) 0xa4;
            cmd[2] = 0x04;
            cmd[3] = 0x00;
            lc = 0x05;
            le = 0x00;

            dataIn[0] = (byte)0x49;
            dataIn[1] = (byte)0x47;
            dataIn[2] = (byte)0x54;
            dataIn[3] = (byte)0x50;
            dataIn[4] = (byte)0x43;
//            lc = 0x07;
//            le = 0x00;
//            dataIn[0] = (byte)0xa0;
//            dataIn[1] = (byte)0x00;
//            dataIn[2] = (byte)0x00;
//            dataIn[3] = (byte)0x00;
//            dataIn[4] = (byte)0x04;
//            dataIn[5] = (byte)0x10;
//            dataIn[6] = (byte)0x10;

//            dataIn[0] = (byte)0x31;
//            dataIn[1] = (byte)0x50;
//            dataIn[2] = (byte)0x41;
//            dataIn[3] = (byte)0x59;
//            dataIn[4] = (byte)0x2E;
//            dataIn[5] = (byte)0x53;
//            dataIn[6] = (byte)0x59;
//            dataIn[7] = (byte)0x53;
//            dataIn[8] = (byte)0x2E;
//            dataIn[9] = (byte)0x44;
//            dataIn[10] = (byte)0x44;
//            dataIn[11] = (byte)0x46;
//            dataIn[12] = (byte)0x30;
//            dataIn[13] = (byte)0x31;
        } else {
            cmd[0] = 0x00;            //0-3 cmd
            cmd[1] = (byte) 0x84;
            cmd[2] = 0x00;
            cmd[3] = 0x00;
            lc = 0x00;
            le = 0x08;
            String sendmsg = "";
            dataIn = sendmsg.getBytes();
            Log.e("liuhao Icc  " ,"PSAM *******");


        }
//
        ApduSend mApduSend = new ApduSend(cmd, lc, dataIn, le);
        ApduResp mApduResp = null;
        byte[] resp = new byte[516];

        ret = posApiHelper.IccCommand(slot, mApduSend.getBytes(), resp);
        if (0 == ret) {
            mApduResp = new ApduResp(resp);
            strInfo = ByteUtil.bytearrayToHexString(mApduResp.DataOut, mApduResp.LenOut) + "SWA:"
                    + ByteUtil.byteToHexString(mApduResp.SWA) + " SWB:" + ByteUtil.byteToHexString(mApduResp.SWB);
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    tv_msg.setText(strInfo);
                }
            });
        } else {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    tv_msg.setText("Command Failed");
                }
            });
            Log.e(TAG, "Icc_Command failed!");
        }
//        byte[] adpuCmd = new byte[]{0x00,(byte) 0xa4,0x04,0x00,0x05,0x49,0x47,0x54,0x50,0x43,0x00};
//        byte[] adpuresp = new byte[512];
//        byte[] pbOutLen = new byte[2];
//
//
//        ret = posApiHelper.SC_ApduCmd(slot,adpuCmd, 11, adpuresp, pbOutLen);
//        if(0 == ret) {
//            strInfo = "Len:"+ pbOutLen[0] +":"+ ByteUtil.bytearrayToHexString(adpuresp, pbOutLen[0]) ;
//            Log.d(TAG, "SC_ApduCmd success!" + strInfo);
//            runOnUiThread(new Runnable() {
//                @Override
//                public void run() {
//                    tv_msg.setText(strInfo);
//                }
//            });
//
//        }
//        else{
//            runOnUiThread(new Runnable() {
//                @Override
//                public void run() {
//                    tv_msg.setText("SC_ApduCmd Failed");
//                }
//            });
//            Log.e(TAG, "SC_ApduCmd failed!");
//        }
//
       posApiHelper.IccClose(slot);

        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }


    //Converting a string of hex character to bytes
    public static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2){
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }



    public void onClick(View v) {

        tv_msg.setText("");

        switch (v.getId()){
            case R.id.button_SingleTest:
                if(isIccChecked){
                    mWorkHandler.sendEmptyMessage(WorkHandler.MSG_WORK_ICCARD_ACTION);
                }else if(isPsam1Checked){
                    mWorkHandler.sendEmptyMessage(WorkHandler.MSG_WORK_PSAM1_ACTION);
                }else if(isPsam2Checked){
                    mWorkHandler.sendEmptyMessage(WorkHandler.MSG_WORK_PSAM2_ACTION);
                }

                break;
        }
    }




}
