package test.apidemo.activity;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.ctk.sdk.PosApiHelper;

/**
 * Created by Administrator on 2017/8/17.
 */

public class PiccActivity extends Activity implements View.OnClickListener {

    static final int TYPE_NFC = 0;
    static final int TYPE_PICC = 1;
    static final int TYPE_M1_WRITE = 2;
    static final int TYPE_M1_READ = 3;
    static final int TYPE_M1_OPERATE = 4;
    static final int TYPE_M1_WRITE_BLOCK = 5;
    static final int TYPE_M1_READ_BLOCK = 6;
    static final int TYPE_PICC_POLL = 7;
    static final int TYPE_PICC_M1_OPERATE = 8;

    byte picc_mode = 'B';
    byte picc_type = 'a';
    byte blkNo = 60;
    byte blkValue[] = new byte[20];
    byte pwd[] = new byte[20];
    byte cardtype[] = new byte[3];
    byte serialNo[] = new byte[50];
    byte dataIn[] = new byte[530];

    byte[] dataM1 = new byte[16];

    TextView textViewMsg = null,tvOpereteType = null;
    Button btnStart, btnNfc,btnReadM1,btnWriteM1,btnOperateM1 ,btnReadM1Block ,btnWriteM1Block ,btnPiccPoll;
    EditText editBlkNo , editWriteData ;
    EditText editM1OperateData , editM1OperateBlkNo ,editM1OperateUpdateNo ;
    RadioGroup rg_operate = null;
    RadioButton rb_add ,rb_equal,rb_Subtraction;

    String strBlkNo = "" , strWriteData = "";

    static byte m1OpereteType = (byte)'+';

    private boolean bIsBack = false;

//    private int RESULT_CODE = 0;

    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    //private boolean bIsFinish = false;

    IFinishCall iFinishCall;
    interface IFinishCall{
        void isFinish(boolean bIsFinish);
    }

    void setIFinishCall(IFinishCall iFinishCall){
        this.iFinishCall = iFinishCall;
    }

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_picc);

        this.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        textViewMsg = (TextView) this.findViewById(R.id.textView_picc);
        //主动获取焦点
        textViewMsg.requestFocus();
        tvOpereteType = (TextView) this.findViewById(R.id.tvOpereteType);
        editBlkNo  = (EditText) findViewById(R.id.editBlkNo);
        editWriteData  = (EditText) findViewById(R.id.editWriteData);

        editM1OperateData  = (EditText) findViewById(R.id.editM1OperateData);
        editM1OperateBlkNo  = (EditText) findViewById(R.id.editM1OperateBlkNo);
        editM1OperateUpdateNo  = (EditText) findViewById(R.id.editM1OperateUpdateNo);

        btnStart = (Button) findViewById(R.id.btnPiccTest);
        btnNfc = (Button) findViewById(R.id.btnNfc);
        btnReadM1 = (Button) findViewById(R.id.btnReadM1);
        btnWriteM1 = (Button) findViewById(R.id.btnWriteM1);
        btnOperateM1 = (Button) findViewById(R.id.btnOperateM1);
        btnReadM1Block = (Button) findViewById(R.id.btnReadM1Block);
        btnWriteM1Block = (Button) findViewById(R.id.btnWriteM1Block);
        btnPiccPoll = (Button) findViewById(R.id.btnPiccPoll);

        btnStart.setOnClickListener(this);
        btnNfc.setOnClickListener(this);
        btnReadM1.setOnClickListener(this);
        btnWriteM1.setOnClickListener(this);
        btnOperateM1.setOnClickListener(this);
        btnReadM1Block.setOnClickListener(this);
        btnWriteM1Block.setOnClickListener(this);
        btnPiccPoll.setOnClickListener(this);

        rg_operate = (RadioGroup) findViewById(R.id.rg_operate);
        rb_add= (RadioButton) findViewById(R.id.rb_add);
        rb_add.setChecked(true);
        rb_Subtraction= (RadioButton) findViewById(R.id.rb_Subtraction);
        rb_equal= (RadioButton) findViewById(R.id.rb_equal);

        rg_operate.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                switch (checkedId){

                    case R.id.rb_add:
                        m1OpereteType = (byte)'+';
                        tvOpereteType.setText(" + ");
                        break;
                    case R.id.rb_Subtraction:
                        m1OpereteType = (byte)'-';
                        tvOpereteType.setText(" - ");
                        break;
                    case R.id.rb_equal:
                        m1OpereteType = (byte)'=';
                        tvOpereteType.setText(" = ");
                        break;
                }
            }
        });

        //start.setEnabled(false);
    }

    @Override
    protected void onResume() {
        super.onResume();

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    protected void onPause() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onPause();
//        isQuit = true;
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();

        bIsBack = true;

//        iFinishCall.isFinish(true);
//        bIsFinish = true;
    }

    public int readNfcCard() {

        synchronized (this) {

            Log.e("nfc", "heyp nfc Picc_Open start!");
            byte[] NfcData_Len = new byte[5];
            final byte[] Technology = new byte[25];
            byte[] NFC_UID = new byte[56];
            byte[] NDEF_message = new byte[500];

            int ret = posApiHelper.PiccNfc(NfcData_Len, Technology, NFC_UID, NDEF_message);

            final int TechnologyLength = NfcData_Len[0] & 0xFF;
            int NFC_UID_length = NfcData_Len[1] & 0xFF;
            int NDEF_message_length = (NfcData_Len[3] & 0xFF) + (NfcData_Len[4] & 0xFF);
            byte[] NDEF_message_data = new byte[NDEF_message_length];
            byte[] NFC_UID_data = new byte[NFC_UID_length];
            System.arraycopy(NFC_UID, 0, NFC_UID_data, 0, NFC_UID_length);
            System.arraycopy(NDEF_message, 0, NDEF_message_data, 0, NDEF_message_length);
            String NDEF_message_data_str = new String(NDEF_message_data);
            String NDEF_str = null;
            if (!TextUtils.isEmpty(NDEF_message_data_str)) {
                NDEF_str = NDEF_message_data_str.substring(NDEF_message_data_str.indexOf("en") + 2, NDEF_message_data_str.length());
            }

            if (ret == 0) {

                posApiHelper.SysBeep();
                //successCount ++;
                if (!TextUtils.isEmpty(NDEF_str)) {

                    final String tmpStr = "TYPE: " + new String(Technology).substring(0, TechnologyLength) + "\n"
                            + "UID: " + ByteUtil.bytearrayToHexString(NFC_UID_data, NFC_UID_data.length) + "\n"
                            + NDEF_str;

                    runOnUiThread(new Runnable() {
                        public void run() {
                            textViewMsg.setText(tmpStr);
                        }
                    });

                } else {

                    final String str="TYPE: " + new String(Technology).substring(0, TechnologyLength) + "\n"
                            + "UID: " + ByteUtil.bytearrayToHexString(NFC_UID_data, NFC_UID_data.length) + "\n"
                            + NDEF_str;

                    runOnUiThread(new Runnable() {
                        public void run() {textViewMsg.setText(str);}
                    });
                }

                //bIsFinish = true;
                //iFinishCall.isFinish(true);

            } else {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textViewMsg.setText("Read Card Failed !..");
                        return;
                    }
                });
            }

            m_bThreadFinished = true;

            return ret;
        }
    }

    public int ByteArrayToInt(byte[] bArr) {
        return bArr.length != 4 ? -1 : (bArr[3] & 255) << 24 | (bArr[2] & 255) << 16 | (bArr[1] & 255) << 8 | (bArr[0] & 255) << 0;
    }

    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.btnNfc:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickNfc", "return return");
                    return;
                }

                piccThread = new PICC_Thread(TYPE_NFC);
                piccThread.start();
                //bIsFinish = false;

                break;

            case R.id.btnPiccTest:
//                startPiccTest();
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickTest", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_PICC);
                piccThread.start();

                break;

            case R.id.btnWriteM1:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickWriteM1", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_M1_WRITE);
                piccThread.start();

                break;

            case R.id.btnReadM1:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickReadM1", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_M1_READ);
                piccThread.start();

                break;

            case R.id.btnOperateM1:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickReadM1", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_M1_OPERATE);
                piccThread.start();

                break;

            case R.id.btnReadM1Block:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickReadM1 Block", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_M1_READ_BLOCK);
                piccThread.start();

                break;

            case R.id.btnWriteM1Block:
                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("onClickWriteM1 Block", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_M1_WRITE_BLOCK);
                piccThread.start();

                break;

            case R.id.btnPiccPoll:

                if (null != piccThread && !piccThread.isThreadFinished()) {
                    Log.e("PiccPoll", "return return");
                    return;
                }
                piccThread = new PICC_Thread(TYPE_PICC_POLL);
                piccThread.start();

                break;
        }
    }

    PICC_Thread piccThread = null;
    private boolean m_bThreadFinished = false;

    public class PICC_Thread extends Thread {

        int type;
        int ret;

        public PICC_Thread(int type) {
            this.type = type;
        }

        public boolean isThreadFinished() {
            return m_bThreadFinished;
        }

        public void run() {

            synchronized (this) {
                m_bThreadFinished = false;

                switch (type){
                    case TYPE_NFC:
                        ret = posApiHelper.PiccOpen();

                        final byte PCardType[]= new byte[4];
                        final byte PMode ='A';
                        final byte PserialNo[] = new byte[40];

                        if (ret == 0){
                            long time = System.currentTimeMillis();
                            while (System.currentTimeMillis() < time + 10000) {

                                if (bIsBack) {
                                    Log.e("PICC", "*****************loop bIsBack true");
                                    m_bThreadFinished = true;
                                    return;
                                }

                                runOnUiThread(new Runnable() {
                                    public void run() {
                                        textViewMsg.setText(getResources().getString(R.string.wait_time));
                                    }
                                });
                                Log.e("liuhao ", "NFC = " + System.currentTimeMillis());

                                ret = posApiHelper.PiccCheck(PMode,  PCardType, PserialNo);
                                if(ret == 0){
                                    runOnUiThread(new Runnable() {
                                        public void run() {
                                            posApiHelper.SysBeep();
                                            textViewMsg.setText("PiccCheck() test ok\n "+
                                                    "\nserialNo : " + ByteUtil.bytearrayToHexString(PserialNo, 4)
                                            );
                                        }
                                    });
                                    m_bThreadFinished = true;
                                    return;
                                }else{
                                    runOnUiThread(new Runnable() {public void run() {textViewMsg.setText("Picc Check Test Failed...");}});
                                }
                            }

                        } else {
                            m_bThreadFinished = true;
                            return;
                        }

                        break;

                    case TYPE_PICC:

                        ret = posApiHelper.PiccOpen();
                        if (0 != ret) {
                            runOnUiThread(new Runnable() {
                                public void run() {textViewMsg.setText("Picc_Open Error");}
                            });
                            Log.e("RsaThread[ run ]", "Picc_Open error!");
                            return;
                        }

                        boolean bPICCCheck = false;

                        ret = posApiHelper.PiccCheck(picc_mode, cardtype, serialNo);
                        Log.e("liuhao picc", "000000000000 ret = " + ret);
                        if (0 == ret) {
                            Log.e("RsaThread[ run ]", "Picc_Check succeed!");
                            bPICCCheck = true;
                        }
                        if (bPICCCheck) {
                            if ('M' == picc_mode) {
                                pwd[0] = (byte) 0xff;
                                pwd[1] = (byte) 0xff;
                                pwd[2] = (byte) 0xff;
                                pwd[3] = (byte) 0xff;
                                pwd[4] = (byte) 0xff;
                                pwd[5] = (byte) 0xff;
                                pwd[6] = (byte) 0x00;

                                picc_type = 'A';
                                ret = posApiHelper.PiccM1Authority(picc_type, blkNo, pwd, serialNo);
                                if (0 == ret) {
                                    runOnUiThread(new Runnable() {
                                        public void run() {textViewMsg.setText("Picc_M1Authority Succeed");}
                                    });

                                    blkValue[0] = (byte) 0x22;
                                    blkValue[1] = (byte) 0x00;
                                    blkValue[2] = (byte) 0x00;
                                    blkValue[3] = (byte) 0x00;
                                    blkValue[4] = (byte) 0xbb;
                                    blkValue[5] = (byte) 0xff;
                                    blkValue[6] = (byte) 0xff;
                                    blkValue[7] = (byte) 0xff;
                                    blkValue[8] = (byte) 0x44;
                                    blkValue[9] = (byte) 0x00;
                                    blkValue[10] = (byte) 0x00;
                                    blkValue[11] = (byte) 0x00;
                                    blkValue[12] = (byte) blkNo;
                                    blkValue[13] = (byte) ~blkNo;
                                    blkValue[14] = (byte) blkNo;
                                    blkValue[15] = (byte) ~blkNo;
                                    ret = posApiHelper.PiccM1ReadBlock(blkNo, blkValue);
                                    if (0 == ret) {
                                        //ret = posApiHelper.PiccM1ReadBlock(blkNo, blkValue);
                                        Log.e("liuhao", "ret = " + ret + ",  blkValue = " + blkValue.toString());
                                        runOnUiThread(new Runnable() {
                                            public void run() { textViewMsg.setText("Picc_M1WriteBlock read blkValue :" + ByteUtil.bytearrayToHexString(blkValue, 20));}
                                        });
                                        posApiHelper.SysBeep();
                                    } else {
                                        runOnUiThread(new Runnable() {
                                            public void run() {textViewMsg.setText("Picc_M1WriteBlock Error    return " + ret);}
                                        });
                                    }
                                } else {
                                    runOnUiThread(new Runnable() {
                                        public void run() {textViewMsg.setText("Picc_M1Authority Error    return " + ret);}
                                    });
                                }
                            } else//
                            {
                                byte cmd[] = new byte[4];
                                cmd[0] = 0x00;            //0-3 cmd
                                cmd[1] = (byte) 0x84;
                                cmd[2] = 0x00;
                                cmd[3] = 0x00;
                                short lc = 0x00;
                                short le = 0x08;
                                dataIn = "1PAY.SYS.DDF01".getBytes();
                                ApduSend ApduSend = new ApduSend(cmd, lc, dataIn, le);
                                ApduResp ApduResp = null;
                                byte[] resp = new byte[516];

                                ret = posApiHelper.PiccCommand(ApduSend.getBytes()/*"00A404000E325041592E5359532E444446303100".getBytes()*/, resp);
                                if (0 == ret) {
                                  //  Lib_Beep();
                                    String strInfo = "";
                                    ApduResp = new ApduResp(resp);
                                    strInfo = ByteUtil.bytearrayToHexString(ApduResp.DataOut, ApduResp.LenOut) + "SWA:" + ByteUtil.byteToHexString(ApduResp.SWA) + " SWB:" + ByteUtil.byteToHexString(ApduResp.SWB);
                                    final String finalStrInfo = strInfo;
                                    runOnUiThread(new Runnable() {
                                        public void run() {textViewMsg.setText(finalStrInfo);}
                                    });
                                } else {
                                    runOnUiThread(new Runnable() {
                                        public void run() {textViewMsg.setText("Picc_Command Error    return " + ret);}
                                    });
                                    Log.e("RsaThread[ run ]", "Picc_Command failed! return " + ret);
                                }
                            }
                        } else {
                            runOnUiThread(new Runnable() {
                                public void run() {textViewMsg.setText(" Looking for cards ");}
                            });
                            Log.e("PICC_Thread11[ run ]", "Time Out!");
                        }
                        posApiHelper.PiccClose();
                        Log.e("PICC_Thread11[ run ]", "posApiHelperPiccClose()!");

                        break;

                    case TYPE_M1_READ:
                        strBlkNo = editBlkNo.getText().toString().trim();
                        if(strBlkNo == null || strBlkNo.length() < 1){
                            runOnUiThread(new Runnable() {
                                public void run() {
                                    textViewMsg.setText(getResources().getString(R.string.blockTips));
                                    Toast.makeText(PiccActivity.this,getResources().getString(R.string.blockTips),Toast.LENGTH_SHORT).show();
                                }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        blkNo = (byte) Integer.parseInt(strBlkNo);

                        pwd[0] = (byte) 0xff;
                        pwd[1] = (byte) 0xff;
                        pwd[2] = (byte) 0xff;
                        pwd[3] = (byte) 0xff;
                        pwd[4] = (byte) 0xff;
                        pwd[5] = (byte) 0xff;
                        pwd[6] = (byte) 0x00;
                        picc_type = 'A';

                        ret = posApiHelper.PiccM1Authority(picc_type, blkNo, pwd, serialNo);
                        if(ret != 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read failed~\n Authority -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        ret = posApiHelper.PiccM1ReadValue(Integer.parseInt(strBlkNo) ,dataM1);
                        if(ret == 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read Success~\n" + ByteUtil.bytearrayToHexString(dataM1,4)); }
                            });
                        }else {
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read failed~ \nret = " + ret); }
                            });
                        }
                        break;

                    case TYPE_M1_WRITE:
                         strBlkNo = editBlkNo.getText().toString().trim();
                         strWriteData = editWriteData.getText().toString().trim();
                        if(strBlkNo == null || strBlkNo.length() < 1 || strWriteData.length() < 1 ){
                            runOnUiThread(new Runnable() {
                                public void run() {
                                    textViewMsg.setText(getResources().getString(R.string.blockTips) + "\nand " + getResources().getString(R.string.writeTips) );
                                    Toast.makeText(PiccActivity.this,getResources().getString(R.string.blockTips) + "and " + getResources().getString(R.string.writeTips),Toast.LENGTH_SHORT).show();
                                }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        blkNo = (byte) Integer.parseInt(strBlkNo);

                        pwd[0] = (byte) 0xff;
                        pwd[1] = (byte) 0xff;
                        pwd[2] = (byte) 0xff;
                        pwd[3] = (byte) 0xff;
                        pwd[4] = (byte) 0xff;
                        pwd[5] = (byte) 0xff;
                        pwd[6] = (byte) 0x00;
                        picc_type = 'A';
                        ret = posApiHelper.PiccM1Authority(picc_type,blkNo, pwd, serialNo);
                        if(ret != 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write failed~\n Authority -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        ret = posApiHelper.PiccM1WriteValue(Integer.parseInt(strBlkNo) ,strWriteData.getBytes());
                        if(ret == 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write Success~\n"); }
                            });
                        }else {
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write failed~ \nret = " + ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        break;

                    case TYPE_M1_READ_BLOCK:
                        strBlkNo = editBlkNo.getText().toString().trim();
                        if(strBlkNo == null || strBlkNo.length() < 1){
                            runOnUiThread(new Runnable() {
                                public void run() {
                                    textViewMsg.setText(getResources().getString(R.string.blockTips));
                                    Toast.makeText(PiccActivity.this,getResources().getString(R.string.blockTips),Toast.LENGTH_SHORT).show();
                                }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        blkNo = (byte) Integer.parseInt(strBlkNo);

                        pwd[0] = (byte) 0xff;
                        pwd[1] = (byte) 0xff;
                        pwd[2] = (byte) 0xff;
                        pwd[3] = (byte) 0xff;
                        pwd[4] = (byte) 0xff;
                        pwd[5] = (byte) 0xff;
                        pwd[6] = (byte) 0x00;
                        picc_type = 'A';
                        ret = posApiHelper.PiccM1Authority(picc_type, blkNo, pwd, serialNo);
                        if(ret != 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read failed~\n Authority -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        ret = posApiHelper.PiccM1ReadBlock((byte)Integer.parseInt(strBlkNo) ,dataM1);
                        if(ret == 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read Block Success~\n" + ByteUtil.bytearrayToHexString(dataM1,16)); }
                            });
                        }else {
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Read Block failed~ \nret = " + ret); }
                            });
                        }
                        break;

                    case TYPE_M1_WRITE_BLOCK:
                        strBlkNo = editBlkNo.getText().toString().trim();
                        strWriteData = editWriteData.getText().toString().trim();
                        if(strBlkNo == null || strBlkNo.length() < 1 || strWriteData.length() < 1 ){
                            runOnUiThread(new Runnable() {
                                public void run() {
                                    textViewMsg.setText(getResources().getString(R.string.blockTips) + "\nand " + getResources().getString(R.string.writeTips) );
                                    Toast.makeText(PiccActivity.this,getResources().getString(R.string.blockTips) + "and " + getResources().getString(R.string.writeTips),Toast.LENGTH_SHORT).show();
                                }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        blkNo = (byte) Integer.parseInt(strBlkNo);

                        pwd[0] = (byte) 0xff;
                        pwd[1] = (byte) 0xff;
                        pwd[2] = (byte) 0xff;
                        pwd[3] = (byte) 0xff;
                        pwd[4] = (byte) 0xff;
                        pwd[5] = (byte) 0xff;
                        pwd[6] = (byte) 0x00;
                        picc_type = 'A';
                        ret = posApiHelper.PiccM1Authority(picc_type, blkNo, pwd, serialNo);
                        if(ret != 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write Block failed~\n Authority -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        ret = posApiHelper.PiccM1WriteBlock((byte)Integer.parseInt(strBlkNo) ,strWriteData.getBytes());
                        if(ret == 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write Block Success~\n"); }
                            });
                        }else {
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Write Block failed~ \nret = " + ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        break;

                    case TYPE_M1_OPERATE:

                        if((editM1OperateBlkNo.getText().toString().trim().length()<1)||(editM1OperateUpdateNo.getText().toString().trim().length()<1)){
                            runOnUiThread(new Runnable() {
                                public void run() {
                                    Toast.makeText(PiccActivity.this,"M1 Operate failed~\n Please Input start blkNO and update blkNO~",Toast.LENGTH_SHORT).show();
                                    textViewMsg.setText("M1 Operate failed~\n Please Input start blkNO and update blkNO~"); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        blkNo = (byte) Integer.parseInt(strBlkNo);

                        pwd[0] = (byte) 0xff;
                        pwd[1] = (byte) 0xff;
                        pwd[2] = (byte) 0xff;
                        pwd[3] = (byte) 0xff;
                        pwd[4] = (byte) 0xff;
                        pwd[5] = (byte) 0xff;
                        pwd[6] = (byte) 0x00;
                        picc_type = 'A';
                        ret = posApiHelper.PiccM1Authority(picc_type, blkNo, pwd, serialNo);
                        if(ret != 0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Operate Authority failed~\n Authority -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        ret = posApiHelper.PiccM1Operate(m1OpereteType,(byte)Integer.parseInt(editM1OperateBlkNo.getText().toString().trim()),
                                editM1OperateData.getText().toString().trim().getBytes(),(byte)Integer.parseInt(editM1OperateUpdateNo.getText().toString().trim()));

                        if(ret!=0){
                            runOnUiThread(new Runnable() {
                                public void run() { textViewMsg.setText("M1 Operate Operate failed~\n Operate -- ret = " +ret); }
                            });
                            m_bThreadFinished = true;
                            return;
                        }

                        break;

                    case TYPE_PICC_POLL:
                        ret = posApiHelper.PiccOpen();

                        final byte CardType[]= new byte[4];
                        final byte UID[] =new byte[10];
                        final byte ucUIDLen[] = new byte[1];
                        final byte ATS[] = new byte[40];
                        final byte ucATSLen[] = new byte[1];
                        final byte SAK[] = new byte[1];

                        if (ret == 0){
                            long time = System.currentTimeMillis();
                            while (System.currentTimeMillis() < time + 10000) {

                                if (bIsBack) {

                                    Log.e("PICC", "*****************loop bIsBack true");
                                    m_bThreadFinished = true;
                                    return;
                                }

                                Log.e("liuhao ", "NFC = " + System.currentTimeMillis());

                                ret = posApiHelper.PiccPolling(CardType, UID, ucUIDLen, ATS, ucATSLen, SAK);

                                if(ret == 0){

                                    textViewMsg.setText("CardType :" + new String(CardType)
                                            + "\nUID : " + ByteUtil.bytearrayToHexString(UID, ucUIDLen[0])
                                            + "\nATS :" + ByteUtil.bytearrayToHexString(ATS, ucATSLen[0])
                                            + "\nSAK :" + ByteUtil.bytearrayToHexString(SAK, 1)
                                    );

                                    m_bThreadFinished = true;
                                    return;
                                }else{

                                    textViewMsg.setText("Picc Poll Test Failed...");
                                }
                            }

                            m_bThreadFinished = true;

                        } else {
                            m_bThreadFinished = true;
                            return;
                        }

                        break;
                }

                m_bThreadFinished = true;
            }
        }
    }

}
