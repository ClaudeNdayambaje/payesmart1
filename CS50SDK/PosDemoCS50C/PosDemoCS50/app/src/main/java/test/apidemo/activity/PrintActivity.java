package test.apidemo.activity;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;

import com.ctk.sdk.PosApiHelper;
import com.google.zxing.BarcodeFormat;

import java.util.Timer;

import test.apidemo.service.MyService;
/**
 * Created by Administrator on 2017/8/17.
 */

public class PrintActivity extends Activity {

    public String tag = "PrintActivity-Robert2";

    final int PRINT_TEST = 0;
    final int PRINT_UNICODE = 1;
    final int PRINT_BMP = 2;
    final int PRINT_BARCODE = 4;
    final int PRINT_CYCLE = 5;
    final int PRINT_LONGER = 7;
    final int PRINT_OPEN = 8;


    final int PRINT_LAB_SINGLE = 9;
    final int PRINT_LAB_CONTINUE = 10;
    final int PRINT_LAB_BAR = 11;
    final int PRINT_LAB_BIT = 12;

    private RadioGroup rg = null;
    private RadioGroup rg_mode = null;
    private RadioButton rb_mode1 = null;
    private Timer timer;
    private Timer timer2;
    private BroadcastReceiver receiver;
    private IntentFilter filter;
    private int voltage_level;
    private int BatteryV;
    private int mode_flag = 0;
    SharedPreferences preferences;
    SharedPreferences sp;
    SharedPreferences.Editor editor;
    private RadioButton rb_high;
    private RadioButton rb_middle;
    private RadioButton rb_low;
    private RadioButton radioButton_4;
    private RadioButton radioButton_5;
    private Button gb_test;
    private Button gb_unicode;
    private Button gb_barcode;
    private Button btnBmp;

    private Button gb_open;
    private Button gb_long;
    private Button gb_printCycle;

    private Button gb_single;
    private Button gb_continue;
    private Button gb_bar;
    private Button gb_bitm;


    private final static int ENABLE_RG = 10;
    private final static int DISABLE_RG = 11;

    TextView textViewMsg = null;
    TextView textViewGray = null;
    int ret = -1;
    private boolean m_bThreadFinished = true;

    private boolean is_cycle = false;
    private int cycle_num = 0;

    private int RESULT_CODE = 0;
    //private Pos pos;
    int IsWorking = 0;

    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    Intent mPrintServiceIntent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_print);
        //linearLayout = (LinearLayout) this.findViewById(R.id.widget_layout_print);
        textViewMsg = (TextView) this.findViewById(R.id.textView_msg);
        textViewGray = (TextView) this.findViewById(R.id.textview_Gray);
        rg = (RadioGroup) this.findViewById(R.id.rg_Gray_type);
        rb_high = (RadioButton) findViewById(R.id.RadioButton_high);
        rb_middle = (RadioButton) findViewById(R.id.RadioButton_middle);
        rb_low = (RadioButton) findViewById(R.id.radioButton_low);
        radioButton_4 = (RadioButton) findViewById(R.id.radioButton_4);
        radioButton_5 = (RadioButton) findViewById(R.id.radioButton_5);
        gb_test = (Button) findViewById(R.id.button_test);
        gb_unicode = (Button) findViewById(R.id.button_unicode);
        gb_barcode = (Button) findViewById(R.id.button_barcode);
        btnBmp = (Button) findViewById(R.id.btnBmp);
        gb_printCycle = (Button) findViewById(R.id.printCycle);

        //----------
        gb_open = (Button) findViewById(R.id.btn_open);
        gb_long = (Button) findViewById(R.id.btnLong);
        gb_single = (Button) findViewById(R.id.btnLabal_single);
        gb_continue = (Button) findViewById(R.id.btnLabal_continue);
        gb_bar = (Button) findViewById(R.id.btnLabal_barcode);
        gb_bitm = (Button) findViewById(R.id.btnLabal_bitmap);

        /*printer mode*/
        rg_mode = (RadioGroup) this.findViewById(R.id.rg_Gray_mode2);
        rb_mode1 = (RadioButton) this.findViewById(R.id.RadioButton_mode1);

        init_Gray();

        rg.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup radioGroup, int checkedId) {

                if (printThread != null && !printThread.isThreadFinished()) {

                    Log.e(tag, "Thread is still running...");
                    return;
                }

                String strGray=getResources().getString(R.string.selectGray);

                switch (checkedId) {
                    case R.id.radioButton_low:
                        textViewGray.setText(strGray+"3");
                        posApiHelper.PrintSetGray(3+mode_flag);
                        setValue(3);

                        break;
                    case R.id.RadioButton_middle:
                        textViewGray.setText(strGray+"2");
                        posApiHelper.PrintSetGray(2+mode_flag);
                        setValue(2);

                        break;
                    case R.id.RadioButton_high:
                        textViewGray.setText(strGray+"1");
                        posApiHelper.PrintSetGray(1+mode_flag);
                        setValue(1);
                        break;

                    case R.id.radioButton_4:
                        textViewGray.setText(strGray+"4");
                        posApiHelper.PrintSetGray(4+mode_flag);
                        setValue(4);
                        break;
                    case R.id.radioButton_5:
                        textViewGray.setText(strGray+"5");
                        posApiHelper.PrintSetGray(5+mode_flag);
                        setValue(5);
                        break;
                }
            }
        });

        /*print mode*/
        rb_mode1.setChecked(true);

        handler.sendEmptyMessage(0x34);
        rg_mode.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup radioGroup, int checkedId) {

                if (printThread != null && !printThread.isThreadFinished()) {

                    Log.e(tag, "Thread is still running...");
                    return;
                }

                switch (checkedId) {
                    case R.id.RadioButton_mode1:
                        posApiHelper.PrintSetMode(0);
                        handler.sendEmptyMessage(0x34);
                        mode_flag = 0;
                        posApiHelper.PrintSetGray(getValue()+mode_flag);
                        break;
                    case R.id.RadioButton_mode2:
                        posApiHelper.PrintSetMode(1);
                        mode_flag = 2;
                        posApiHelper.PrintSetGray(getValue()+mode_flag);
                        handler.sendEmptyMessage(0x56);
                        break;
                    default:
                        handler.sendEmptyMessage(0x34);
                        posApiHelper.PrintSetMode(0);
                        break;
                }
            }
        });

    }

    private void setValue(int val) {
        sp = getSharedPreferences("Gray", MODE_PRIVATE);
        SharedPreferences.Editor editor = sp.edit();
        editor.putInt("value", val);
        editor.commit();
    }

    private int getValue() {
        sp = getSharedPreferences("Gray", MODE_PRIVATE);
        int value = sp.getInt("value", 2);
        return value;
    }

    private void init_Gray() {
        int flag = getValue();
        posApiHelper.PrintSetGray(flag);

        String strGray=getResources().getString(R.string.selectGray);

        if (flag == 3) {
            rb_low.setChecked(true);
            textViewGray.setText(strGray+"3");
        }else if(flag == 2){
            rb_middle.setChecked(true);
            textViewGray.setText(strGray+"2");
        }else if(flag == 1){
            rb_high.setChecked(true);
            textViewGray.setText(strGray+"1");
        }else if(flag == 4){
            radioButton_4.setChecked(true);
            textViewGray.setText(strGray+"4");
        }else if(flag == 5){
            radioButton_5.setChecked(true);
            textViewGray.setText(strGray+"5");
        }
    }

    @Override
    protected void onResume() {
        // TODO Auto-generated method stub

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onResume();
        filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
    }

    @Override
    protected void onPause() {
        // TODO Auto-generated method stub

        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        super.onPause();
        QuitHandler();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    public boolean onKeyDown(int keyCode, KeyEvent event) {
        Log.d("onKeyDown", "keyCode = " + keyCode);

        Log.d("ROBERT2 onKeyDown", "keyCode = " + keyCode);
        Log.d("ROBERT2 onKeyDown", "IsWorking== " + IsWorking);
        if (keyCode == event.KEYCODE_BACK) {
            if (IsWorking == 1)
                return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    public void onClickTest(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_TEST);
        printThread.start();
    }

    public void onClickUnicodeTest(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_UNICODE);
        printThread.start();

    }

    public void OnClickBarcode(View view) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_BARCODE);
        printThread.start();
    }

    public void onClickBmp(View view) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_BMP);
        printThread.start();

    }

    public void onClickCycle(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        if (is_cycle == false) {
            is_cycle = true;
            preferences = getSharedPreferences("count", MODE_PRIVATE);

            cycle_num = preferences.getInt("count", 0);
            SendMsg("total cycle num =" + cycle_num);
            Log.e(tag, "Thread is still 3000ms...");
            handlers.postDelayed(runnable, 3000);

            gb_printCycle.setText("Stop");

        }else{
            handlers.removeCallbacks(runnable);
            gb_printCycle.setText("Cycle");
            is_cycle = false;
        }
    }

    public void onClickClean(View v) {
        textViewMsg.setText("");
        preferences = getSharedPreferences("count", MODE_PRIVATE);
        cycle_num = preferences.getInt("count", 0);
        editor = preferences.edit();
        cycle_num = 0;
        editor.putInt("count", cycle_num);
        editor.commit();
        QuitHandler();
    }

    public void onClickPrnOpen(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_OPEN);
        printThread.start();
    }

    public void onClickLong(View v) {

        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }
        printThread = new Print_Thread(PRINT_LONGER);
        printThread.start();
    }

    public void onClick_single(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_LAB_SINGLE);
        printThread.start();
    }

    public void onClick_continue(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_LAB_CONTINUE);
        printThread.start();
    }

    public void onClick_barcode(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_LAB_BAR);
        printThread.start();
    }

    public void onClick_bitmap(View v) {
        if (printThread != null && !printThread.isThreadFinished()) {
            Log.e(tag, "Thread is still running...");
            return;
        }

        printThread = new Print_Thread(PRINT_LAB_BIT);
        printThread.start();
    }

    public void QuitHandler() {
        is_cycle = false;
        gb_test.setEnabled(true);
        gb_barcode.setEnabled(true);
        btnBmp.setEnabled(true);
        gb_unicode.setEnabled(true);
        handlers.removeCallbacks(runnable);
    }

    Handler handlers = new Handler();
    Runnable runnable = new Runnable() {

        @Override
        public void run() {
            // TODO Auto-generated method stub

            Log.e(tag, "TIMER log...");
            printThread = new Print_Thread(PRINT_CYCLE);
            printThread.start();

            Log.e(tag, "TIMER log2...");
            if (RESULT_CODE == 0) {
                editor = preferences.edit();
                editor.putInt("count", ++cycle_num);
                editor.commit();
                Log.e(tag, "cycle num=" + cycle_num);
                SendMsg("cycle num =" + cycle_num);
            }
            handlers.postDelayed(this, 15000);

        }
    };

    Print_Thread printThread = null;

    public class Print_Thread extends Thread {

        String content = "1234567890";
        int type;

        public boolean isThreadFinished() {
            return m_bThreadFinished;
        }

        public Print_Thread(int type) {
            this.type = type;
        }

        public void run() {
            Log.d("Robert2", "Print_Thread[ run ] run() begin");
            Message msg = Message.obtain();
            Message msg1 = new Message();

            synchronized (this) {

                m_bThreadFinished = false;
                try {
                    ret = posApiHelper.PrintInit();
                } catch (Exception e) {
                    e.printStackTrace();
                }

                Log.e(tag, "init code:" + ret);

                ret = getValue();
                Log.e(tag, "getValue():" + ret);

                posApiHelper.PrintSetGray(ret);
                Log.e(tag, "PrintSetGray():" );

                ret = posApiHelper.PrintCheckStatus();
                Log.e(tag, "PrintCheckStatus():" );
                if (ret == -1) {
                    RESULT_CODE = -1;
                    Log.e(tag, "Lib_PrnCheckStatus fail, ret = " + ret);
                    SendMsg("Error, No Paper ");
                    m_bThreadFinished = true;
                    return;
                } else if (ret == -2) {
                    RESULT_CODE = -1;
                    Log.e(tag, "Lib_PrnCheckStatus fail, ret = " + ret);
                    SendMsg("Error, Printer Too Hot ");
                    m_bThreadFinished = true;
                    return;
                } else if (ret == -3) {
                    RESULT_CODE = -1;
                    Log.e(tag, "voltage = " + (BatteryV * 2));
                    SendMsg("Battery less :" + (BatteryV * 2));
                    m_bThreadFinished = true;
                    return;
                }
                else
                {
                    RESULT_CODE = 0;
                }


                Log.d("Robert2", "Lib_PrnStart type= "+type );
                switch (type) {

                    case PRINT_LONGER:
                        SendMsg("PRINT LONG");

                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                        String stringg = " a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?";

                        posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
                        posApiHelper.PrintStr("a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >? a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >? a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?\n");
//						ret = Print.Lib_PrnStr(" a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?a b c d e f g h i j k l m n o p q r s t u v w x z A B C D E F G H I J K L M N O P Q R S T U V W X Z 1 2 3 4 5 6 7 8 9 ! @ # $ % ^ & * () _ + ~   [ ] , . / ; ' { } : : | < >?");
                        posApiHelper.PrintBarcode(content, 360, 120, "CODE_128");
                        posApiHelper.PrintStr("CODE_128 : " + content + "\n\n");
                        posApiHelper.PrintBarcode(content, 240, 240, "QR_CODE");
                        posApiHelper.PrintStr("QR_CODE : " + content + "\n\n");
                        posApiHelper.PrintStr("发卡行(ISSUER):01020001 工商银行\n");
                        posApiHelper.PrintStr("卡号(CARD NO):\n");
                        posApiHelper.PrintStr("    9558803602109503920\n");
                        posApiHelper.PrintStr("收单行(ACQUIRER):03050011民生银行\n");
                        posApiHelper.PrintStr("交易类型(TXN. TYPE):消费/SALE\n");
                        posApiHelper.PrintStr("卡有效期(EXP. DATE):2013/08\n");
                        posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                        posApiHelper.PrintStr("                                         ");
                        posApiHelper.PrintStr("\n");
                        posApiHelper.PrintStr("\n");
                        posApiHelper.PrintStr("\n");

                        SendMsg("Printing... ");
                        final long starttime_long = System.currentTimeMillis();
                        ret = posApiHelper.PrintStart();
                        Log.e(tag, "PrintStart ret = " + ret);

                        msg1.what = ENABLE_RG;

                        handler.sendMessage(msg1);

                        if (ret != 0) {
                            RESULT_CODE = -1;
                            Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if(ret == -2) {
                                SendMsg("too hot ");
                            }else if(ret == -3) {
                                SendMsg("low voltage ");
                            }else{
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");

                            final long endttime_long = System.currentTimeMillis();
                            final long totaltime_long = starttime_long - endttime_long;
                            SendMsg("Print finish " );
                        }
                        break;

                    case PRINT_TEST:
                        Log.d("Robert2", "Lib_PrnStart ret START0 " );
                        SendMsg("PRINT_TEST");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                        posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
//                        posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
//                        posApiHelper.PrintSetBold(1);
//                        posApiHelper.PrintStr("Terminal ID:50000001\n");
//                        posApiHelper.PrintStr("Merchant ID:79000000000002\n");
//                        posApiHelper.PrintStr("Date Time:25-05 2022 09:53:50\n");
//                        posApiHelper.PrintStr("Total Topup:2480 3636\n");
//                        posApiHelper.PrintStr("Consumed:26454528\n");
//                        posApiHelper.PrintStr("Available Balance:149108\n");
//                        posApiHelper.PrintSetBold(0);
//
//                        posApiHelper.PrintStr("Terminal ID:50000001\n");
//                        posApiHelper.PrintStr("Merchant ID:79000000000002\n");
//                        posApiHelper.PrintStr("Date Time:25-05 2022 09:53:50\n");
//                        posApiHelper.PrintStr("Total Topup:2480 3636\n");
//                        posApiHelper.PrintStr("Consumed:26454528\n");
//                        posApiHelper.PrintStr("Available Balance:149108\n");
                        posApiHelper.PrintStr("ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ");
                        posApiHelper.PrintStr("αβγδεζηθικλμνξοπρστυφχψως");
                        posApiHelper.PrintStr("ΆΈΉΊΎΏάέήίόύώ");
                        posApiHelper.PrintStr("ΫΪϋϊ");
                        posApiHelper.PrintStr("΅Υ΅Ιΰΐ");
                        posApiHelper.PrintStr("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
                        posApiHelper.PrintStr("abcdefghijklmnopqrstuvwxyz");
                        posApiHelper.PrintStr("1234567890");
                        posApiHelper.PrintStr("!@#$%^&*()-_`~,<.>/?\"':;€");
                        posApiHelper.PrintStr("αβγδεζηθικλμνξοπρστυφχψωςABCDEFGHIJKLMNOPQRSTUVWXYZ");

                        posApiHelper.PrintTableText(new String[]{"Bonjour! ?a fait longtemps!","4567"},new int[]{8,2},new int[]{0,2});
                        ret = posApiHelper.PrintSetFontTTF("/storage/emulated/0/Download/NotoSansDevanagari-Regular.ttf", (byte)24, (byte)24);
                        posApiHelper.PrintStr("ठूलो कुरा के हो");




//                        posApiHelper.PrintStr("中文:你好，好久不见。\n");
//                        posApiHelper.PrintStr("英语:Hello, Long time no see   ￡ ：2089.22\n");
//                        posApiHelper.PrintStr("意大利语Italian :Ciao, non CI vediamo da Molto Tempo.\n");
//                        posApiHelper.PrintStr("西班牙语:España, ¡Hola! Cuánto tiempo sin verte!\n");
//                        posApiHelper.PrintStr("法语:Bonjour! Ça fait longtemps!\n");
//                        posApiHelper.PrintStr("ABCDEFGHIJKLMNHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNHIJKLMNOPQRSTUVWXYZ\n");
//                        posApiHelper.PrintStr("abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz\n");
//                        posApiHelper.PrintStr("12345678901234567890123456789012345678901234567890+_)(*&^%$#@!~\n");
                        posApiHelper.PrintStr("                                         \n");
                        posApiHelper.PrintStr("                                         \n");

                        SendMsg("Printing... ");
                        ret = posApiHelper.PrintStart();

                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("Robert2", "Lib_PrnStart ret = " + ret);

                        if (ret != 0) {
                            RESULT_CODE = -1;
                            Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if(ret == -2) {
                                SendMsg("too hot ");
                            }else if(ret == -3) {
                                SendMsg("low voltage ");
                            }else{
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        Log.d("Robert2", "Lib_PrnStart ret9 " );
                        break;


                    case PRINT_CYCLE:

                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                        posApiHelper.PrintSetFont((byte) 16, (byte) 16, (byte) 0x33);
                        for (int i = 1; i < 3; i++) {
                            posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x33);
                            posApiHelper.PrintStr("打印第：" + i + "次\n");
                            posApiHelper.PrintStr("商户存根MERCHANT COPY\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - - - - - - - - - -\n");
                            posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
                            posApiHelper.PrintStr("商户名称(MERCHANT NAME):\n");
                            posApiHelper.PrintStr("中国银联直连测试\n");
                            posApiHelper.PrintStr("商户编号(MERCHANT NO):\n");
                            posApiHelper.PrintStr("    001420183990573\n");
                            posApiHelper.PrintStr("终端编号(TERMINAL NO):00026715\n");
                            posApiHelper.PrintStr("操作员号(OPERATOR NO):12345678\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("发卡行(ISSUER):01020001 工商银行\n");
                            posApiHelper.PrintStr("卡号(CARD NO):\n");
                            posApiHelper.PrintStr("    9558803602109503920\n");
                            posApiHelper.PrintStr("收单行(ACQUIRER):03050011民生银行\n");
                            posApiHelper.PrintStr("交易类型(TXN. TYPE):消费/SALE\n");
                            posApiHelper.PrintStr("卡有效期(EXP. DATE):2013/08\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("批次号(BATCH NO)  :000023\n");
                            posApiHelper.PrintStr("凭证号(VOUCHER NO):000018\n");
                            posApiHelper.PrintStr("授权号(AUTH NO)   :987654\n");
                            posApiHelper.PrintStr("日期/时间(DATE/TIME):\n");
                            posApiHelper.PrintStr("    2008/01/28 16:46:32\n");
                            posApiHelper.PrintStr("交易参考号(REF. NO):200801280015\n");
                            posApiHelper.PrintStr("金额(AMOUNT):  RMB:2.55\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("备注/REFERENCE\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            posApiHelper.PrintSetFont((byte) 16, (byte) 16, (byte) 0x00);
                            posApiHelper.PrintStr("持卡人签名(CARDHOLDER SIGNATURE)\n");
                            posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("  本人确认以上交易，同意将其计入本卡帐户\n");
                            posApiHelper.PrintStr("  I ACKNOWLEDGE SATISFACTORY RECEIPT\n");
                            posApiHelper.PrintStr("\n\n\n\n\n\n\n\n\n\n");

                            //  ret = posApiHelper.PrintCtnStart();
                            ret = posApiHelper.PrintStart();
                            // if (ret != 0) break;
                        }

                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);
                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;
                            Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if(ret == -2) {
                                SendMsg("too hot ");
                            }else if(ret == -3) {
                                SendMsg("low voltage ");
                            }
                        } else {
                            RESULT_CODE = 0;
                        }


                        break;

                    case PRINT_UNICODE:
                        Log.d("Robert2", "Lib_PrnStart ret START11 " );
                        final long starttime = System.currentTimeMillis();
                        Log.e("Robert2", "PRINT_UNICODE starttime = " + starttime);

                        SendMsg("PRINT_UNICODE");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);
                        posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);

                        posApiHelper.PrintStr("中文:你好，好久不见。\n");
                        posApiHelper.PrintStr("英语: ￡20.00 ，￡20.00 ，￡20.00 Hello, Long time no see\n");
                        posApiHelper.PrintStr("西班牙语:España, ¡Hola! Cuánto tiempo sin verte!\n");
                        posApiHelper.PrintStr("法语:Bonjour! Ça fait longtemps!\n");
                        posApiHelper.PrintStr("Italian :Ciao, non CI vediamo da Molto Tempo.\n");


                        SendMsg("Printing... ");
                        //ret = posApiHelper.PrintCtnStart();
                        ret = posApiHelper.PrintStart();

                            posApiHelper.PrintSetFont((byte) 16, (byte) 16, (byte) 0x33);
                            for (int i = 1; i < 3; i++) {
                                posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x33);
                                posApiHelper.PrintStr("打印第：" + i + "次\n");
                            posApiHelper.PrintStr("商户存根MERCHANT COPY\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - - - - - - - - - -\n");
                            posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
                            posApiHelper.PrintStr("商户名称(MERCHANT NAME):\n");
                            posApiHelper.PrintStr("中国银联直连测试\n");
                            posApiHelper.PrintStr("商户编号(MERCHANT NO):\n");
                            posApiHelper.PrintStr("    001420183990573\n");
                            posApiHelper.PrintStr("终端编号(TERMINAL NO):00026715\n");
                            posApiHelper.PrintStr("操作员号(OPERATOR NO):12345678\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("发卡行(ISSUER):01020001 工商银行\n");
                            posApiHelper.PrintStr("卡号(CARD NO):\n");
                            posApiHelper.PrintStr("    9558803602109503920\n");
                            posApiHelper.PrintStr("收单行(ACQUIRER):03050011民生银行\n");
                            posApiHelper.PrintStr("交易类型(TXN. TYPE):消费/SALE\n");
                            posApiHelper.PrintStr("卡有效期(EXP. DATE):2013/08\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("批次号(BATCH NO)  :000023\n");
                            posApiHelper.PrintStr("凭证号(VOUCHER NO):000018\n");
                            posApiHelper.PrintStr("授权号(AUTH NO)   :987654\n");
                            posApiHelper.PrintStr("日期/时间(DATE/TIME):\n");
                            posApiHelper.PrintStr("    2008/01/28 16:46:32\n");
                            posApiHelper.PrintStr("交易参考号(REF. NO):200801280015\n");
                            posApiHelper.PrintStr("金额(AMOUNT):  RMB:2.55\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("备注/REFERENCE\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - -\n");
                            posApiHelper.PrintSetFont((byte) 16, (byte) 16, (byte) 0x00);
                            posApiHelper.PrintStr("持卡人签名(CARDHOLDER SIGNATURE)\n");
                            posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("- - - - - - - - - - - - - - - - - - - - - - - -\n");
                            //	posApiHelper.PrintStr("\n");
                            posApiHelper.PrintStr("  本人确认以上交易，同意将其计入本卡帐户\n");
                            posApiHelper.PrintStr("  I ACKNOWLEDGE SATISFACTORY RECEIPT\n");
                            posApiHelper.PrintStr("\n\n\n\n\n\n\n\n\n\n");

                          //  ret = posApiHelper.PrintCtnStart();
                                ret = posApiHelper.PrintStart();
                           // if (ret != 0) break;
                        }

                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);
                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;
                            Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if(ret == -2) {
                                SendMsg("too hot ");
                            }else if(ret == -3) {
                                SendMsg("low voltage ");
                            }else{
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");

                            final long endttime = System.currentTimeMillis();
                            Log.e("printtime", "PRINT_UNICODE endttime = " + endttime);
                            final long totaltime = starttime - endttime;
                            //SendMsg("Print Finish totaltime" + totaltime);
                            SendMsg("Print finish" );
                        }

                        //ret = posApiHelper.PrintClose();
                        break;

                    case PRINT_OPEN:
                        SendMsg("PRINT_OPEN");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                        SendMsg("Print Open... ");

                        posApiHelper.PrintStr("                                         \n");
                        ret = posApiHelper.PrintStart();
                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;
                            Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if (ret == -2) {
                                SendMsg("too hot ");
                            } else if (ret == -3) {
                                SendMsg("low voltage ");
                            } else {
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        break;

                    case PRINT_BMP:
                        SendMsg("PRINT_BMP");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                     //   Bitmap bmp = BitmapFactory.decodeResource(PrintActivity.this.getResources(), R.mipmap.metrolinx1bitdepth);
                        final long start_BmpD = System.currentTimeMillis();

                        Bitmap bmp1 = BitmapFactory.decodeResource(PrintActivity.this.getResources(), R.mipmap.test001);
                        final long end_BmpD = System.currentTimeMillis();
                        final long decodetime = end_BmpD - start_BmpD;
                        final long start_PrintBmp = System.currentTimeMillis();
                        ret = posApiHelper.PrintBmp(bmp1);
                        posApiHelper.PrintStr("                                         \n");
                        if (ret == 0) {
                            posApiHelper.PrintStr("\n\n\n");
                            posApiHelper.PrintStr("                                         \n");
                            posApiHelper.PrintStr("                                         \n");

                            SendMsg("Printing... ");
                           // ret = posApiHelper.PrintCtnStart();
                            ret = posApiHelper.PrintStart();
                            msg1.what = ENABLE_RG;
                            handler.sendMessage(msg1);

                            Log.d("", "Lib_PrnStart ret = " + ret);
                            if (ret != 0) {
                                RESULT_CODE = -1;
                                Log.e("liuhao", "Lib_PrnStart fail, ret = " + ret);
                                if (ret == -1) {
                                    SendMsg("No Print Paper ");
                                } else if(ret == -2) {
                                    SendMsg("too hot ");
                                }else if(ret == -3) {
                                    SendMsg("low voltage ");
                                }else{
                                    SendMsg("Print fail ");
                                }
                            } else {
                                final long end_PrintBmp = System.currentTimeMillis();

                                RESULT_CODE = 0;
                                final long PrintTime = start_PrintBmp - end_PrintBmp;
                                SendMsg("Print Finish");
                               // SendMsg("Print Finish BMP decodetime="+decodetime + "PrintBmpTime"+PrintTime);
                            }
                        } else {
                            RESULT_CODE = -1;
                            SendMsg("Lib_PrnBmp Failed");
                        }
                        break;

                    case PRINT_BARCODE:
                        SendMsg("PRINT_BARCODE");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);

                        content = "com.chips.ewallet.scheme://{\"PayeeMemberUuid\":\"a3d7fe8e-873d-499b-9f11-000000000000\",\"PayerMemberUuid\":null,\"TotalAmount\":\"900\",\"PayeeSiteUuid\":null,\"PayeeTransId\":\"100101-084850-6444\",\"PayeeSiteReference\":\"\",\"PayeeDescription\":null,\"ConfirmationUuid\":null,\"StpReference\":null}";
                        posApiHelper.PrintStr("QR_CODE display " );
                        posApiHelper.PrintBarcode(content, 360, 360, "QR_CODE");
                        posApiHelper.PrintStr("PrintQrCode_Cut display " );
                        posApiHelper.PrintQrCode_Cut(content, 360, 360, "QR_CODE");
                        posApiHelper.PrintStr("PrintCutQrCode_Str display " );
                        posApiHelper.PrintCutQrCode_Str(content,"PK TXT adsad adasd sda",5, 300, 300, "QR_CODE");
                        posApiHelper.PrintStr("QR_CODE : " + content + "\n\n");
                        posApiHelper.PrintStr("                                        \n");
                        posApiHelper.PrintStr("                                        \n");

                        SendMsg("Printing... ");
                        //ret = posApiHelper.PrintCtnStart();
                        ret = posApiHelper.PrintStart();
                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;

                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if(ret == -2) {
                                SendMsg("too hot ");
                            }else if(ret == -3) {
                                SendMsg("low voltage ");
                            }else{
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }

                        break;



                    case PRINT_LAB_SINGLE:
                        SendMsg("SINGLE");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);
                        SendMsg("Print SINGLE... ");
                        posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);

                        posApiHelper.PrintStr("Alibaba taobao shop");
                        posApiHelper.PrintStr("amount:30 dollars");
                        posApiHelper.PrintStr("weight:30 kg");
                        posApiHelper.PrintStr("中文:你好，好久不见。");
                        posApiHelper.PrintStr("中文:你好，好久不见。");
                        posApiHelper.PrintStr("中文:你好，好久不见。");
                        posApiHelper.PrintStr("中文:你好，好久不见。");


                        //error
//                        posApiHelper.PrintStr("中文:你好，好久不见。");
//                        posApiHelper.PrintStr("中文:你好，好久不见。");
//                        posApiHelper.PrintStr("中文:你好，好久不见。");


                        //good
//                        posApiHelper.PrintStr("中文:你好，好久不见。");
//                        posApiHelper.PrintStr("中文:你好，好久不见。");
                        posApiHelper.PrintStr("中文:你好，好久不见。");
                        posApiHelper.PrintStr("thank you\n");

                    //    ret =  posApiHelper.PrintCtnStart();
                        ret = posApiHelper.PrintStart();
                        ret = posApiHelper.PrintLabLocate(100);
                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;

                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if (ret == -2) {
                                SendMsg("too hot ");
                            } else if (ret == -3) {
                                SendMsg("label  fail ");
                            } else {
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        break;

                    case PRINT_LAB_CONTINUE:
                        int j = 0;
                        SendMsg("continue");
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);
                        SendMsg("Print continue... ");
                        for(j = 0; j <3; j++)
                        {
                            posApiHelper.PrintSetFont((byte) 24, (byte) 24, (byte) 0x00);
                            posApiHelper.PrintStr("Shopping");
                            posApiHelper.PrintStr("amount:00 dollars");
                            posApiHelper.PrintStr("weight:00 kg");
                            posApiHelper.PrintStr("the unit price:00");
                            posApiHelper.PrintStr("time...  day...");
                            posApiHelper.PrintStr("Have a nice day\n");
                            posApiHelper.PrintStr("中文:你好，好久不见。");
                            posApiHelper.PrintStr("中文:你好，好久不见。");
                           // ret =  posApiHelper.PrintCtnStart();
                            ret = posApiHelper.PrintStart();
                            ret = posApiHelper.PrintLabLocate(100);
                            if(ret != 0)
                                break;
                        }

                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;

                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if (ret == -2) {
                                SendMsg("too hot ");
                            } else if (ret == -3) {
                                SendMsg("label  fail ");
                            } else {
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        break;

                    case PRINT_LAB_BAR:
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);
                        content = "www.baidu.com/123456789123456789123456789";
                        posApiHelper.PrintQrCode_Cut(content, 200, 200, "QR_CODE");
                        SendMsg("Printing... ");
                        //ret = posApiHelper.PrintCtnStart();
                        ret = posApiHelper.PrintStart();
                        ret = posApiHelper.PrintLabLocate(100);
                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;

                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if (ret == -2) {
                                SendMsg("too hot ");
                            } else if (ret == -3) {
                                SendMsg("label  fail");
                            } else {
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        break;

                    case PRINT_LAB_BIT:
                        msg.what = DISABLE_RG;
                        handler.sendMessage(msg);
                        SendMsg("Print bitmap... ");

                        bmp1 = BitmapFactory.decodeResource(PrintActivity.this.getResources(), R.mipmap.test001);
                        ret = posApiHelper.PrintBmp(bmp1);
                        SendMsg("Printing... ");
                       // ret = posApiHelper.PrintCtnStart();
                        ret = posApiHelper.PrintStart();
                        ret = posApiHelper.PrintLabLocate(100);
                        msg1.what = ENABLE_RG;
                        handler.sendMessage(msg1);

                        Log.d("", "Lib_PrnStart ret = " + ret);
                        if (ret != 0) {
                            RESULT_CODE = -1;

                            if (ret == -1) {
                                SendMsg("No Print Paper ");
                            } else if (ret == -2) {
                                SendMsg("too hot ");
                            } else if (ret == -3) {
                                SendMsg("label  fail");
                            } else {
                                SendMsg("Print fail ");
                            }
                        } else {
                            RESULT_CODE = 0;
                            SendMsg("Print Finish ");
                        }
                        break;

                    default:
                        break;
                }
                m_bThreadFinished = true;
            }
        }
    }


    public class BatteryReceiver extends BroadcastReceiver {
        public void onReceive(Context context, Intent intent) {
            voltage_level = intent.getExtras().getInt("level");// ��õ�ǰ����
            Log.e("wbw", "current  = " + voltage_level);
            BatteryV = intent.getIntExtra("voltage", 0);  //电池电压
            Log.e("wbw", "BatteryV  = " + BatteryV);
            Log.e("wbw", "V  = " + BatteryV * 2 / 100);
            //	m_voltage = (int) (65+19*voltage_level/100); //放大十倍
            //   Log.e("wbw","m_voltage  = " + m_voltage );
        }
    }

    // 在Activity中，我们通过ServiceConnection接口来取得建立连接与连接意外丢失的回调

    ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
//            MyService.MyBinder binder = (MyService.MyBinder)service;
//            binder.getService();// 获取到的Service即MyService
            MyService.MyBinder binder = (MyService.MyBinder) service;
            MyService myService = binder.getService();

            myService.setCallback(new MyService.CallBackPrintStatus() {
                @Override
                public void printStatusChange(String strStatus) {
                    SendMsg(strStatus);
                }
            });

        }

        @Override
        public void onServiceDisconnected(ComponentName name) {

        }
    };

    public void SendMsg(String strInfo) {
        Message msg = new Message();
        Bundle b = new Bundle();
        b.putString("MSG", strInfo);
        msg.setData(b);
        handler.sendMessage(msg);
    }

    private Handler handler = new Handler() {
        @Override
        public void handleMessage(Message msg) {

            switch (msg.what) {
                case DISABLE_RG:
                    IsWorking = 1;
                    rb_high.setEnabled(false);
                    rb_middle.setEnabled(false);
                    rb_low.setEnabled(false);
                    radioButton_4.setEnabled(false);
                    radioButton_5.setEnabled(false);
                    break;

                case ENABLE_RG:
                    IsWorking = 0;
                    rb_high.setEnabled(true);
                    rb_middle.setEnabled(true);
                    rb_low.setEnabled(true);
                    radioButton_4.setEnabled(true);
                    radioButton_5.setEnabled(true);
                    break;

                case 0x34:
                    gb_single.setEnabled(false);
                    gb_continue.setEnabled(false);
                    gb_bar.setEnabled(false);
                    gb_bitm.setEnabled(false);

                    gb_single.setBackgroundColor(Color.GRAY);
                    gb_continue.setBackgroundColor(Color.GRAY);
                    gb_bar.setBackgroundColor(Color.GRAY);
                    gb_bitm.setBackgroundColor(Color.GRAY);

                    gb_test.setEnabled(true);
                    gb_unicode.setEnabled(true);
                    gb_barcode.setEnabled(true);
                    btnBmp.setEnabled(true);
                    gb_open.setEnabled(true);
                    gb_long.setEnabled(true);
                    gb_printCycle.setEnabled(true);

                    gb_test.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_unicode.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_barcode.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    btnBmp.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_open.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_long.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_printCycle.setBackgroundColor(getResources().getColor(R.color.item_image_select));

                    break;

                case 0x56:
                    //gb_unicode.setVisibility(View.INVISIBLE);
                    gb_test.setBackgroundColor(Color.GRAY);
                    gb_unicode.setBackgroundColor(Color.GRAY);
                    gb_barcode.setBackgroundColor(Color.GRAY);
                    btnBmp.setBackgroundColor(Color.GRAY);
                    gb_open.setBackgroundColor(Color.GRAY);
                    gb_long.setBackgroundColor(Color.GRAY);
                    gb_printCycle.setBackgroundColor(Color.GRAY);

                    gb_test.setEnabled(false);
                    gb_unicode.setEnabled(false);
                    gb_barcode.setEnabled(false);
                    btnBmp.setEnabled(false);
                    gb_open.setEnabled(false);
                    gb_long.setEnabled(false);
                    gb_printCycle.setEnabled(false);

                    gb_single.setEnabled(true);
                    gb_continue.setEnabled(true);
                    gb_bar.setEnabled(true);
                    gb_bitm.setEnabled(true);

                    gb_single.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_continue.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_bar.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    gb_bitm.setBackgroundColor(getResources().getColor(R.color.item_image_select));
                    break;

                default:
                    Bundle b = msg.getData();
                    String strInfo = b.getString("MSG");
                    textViewMsg.setText(strInfo);
                    break;
            }
        }
    };

}
