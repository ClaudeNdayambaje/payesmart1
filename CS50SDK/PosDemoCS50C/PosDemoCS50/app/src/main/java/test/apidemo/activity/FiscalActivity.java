package test.apidemo.activity;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import com.ctk.sdk.PosApiHelper;

public class FiscalActivity extends Activity implements View.OnClickListener{

    private final String TAG = "FiscalActivity";
    private Context mContext;
    private TextView mResultTextView;
    private Button mTestButton;
    private Button mOpenButton;
    private Button mCloseButton;

    private WorkHandler mWorkHandler;
    private HandlerThread mWorkThread;
    private String mResponse;
    private int error_code;

    PosApiHelper posApiHelper = PosApiHelper.getInstance();



    private class WorkHandler extends Handler {

        public static final int MSG_FISCAL_OPEN = 1;
        public static final int MSG_FISCAL_TEST = 2;
        public static final int MSG_FISCAL_CLOSE = 3;

        public WorkHandler(Looper looper) {
            super(looper);
        }

        @Override
        public void handleMessage(Message msg) {
            int what = msg.what;
            switch (what) {
                case MSG_FISCAL_OPEN:
                    int ret;
                    ret = posApiHelper.fiscalOpen(115200,8,1,'N','N');
                    if(ret == 0){
                        runOnUiThread(new Runnable() {
                            public void run() {
                                mResultTextView.setText("Fiscal Open success");
                            }
                        });
                    }
                    break;
                case MSG_FISCAL_TEST:
                    fiscaltest();

                    break;
                case MSG_FISCAL_CLOSE:
                    int close;
                    close = posApiHelper.fiscalClose();
                    if(close == 0){
                        runOnUiThread(new Runnable() {
                            public void run() {
                                mResultTextView.setText("Fiscal Close success");
                            }
                        });
                    }
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

        setContentView(R.layout.activity_fiscal);
        mContext = this;

        mResultTextView = (TextView) this.findViewById(R.id.result);

        mTestButton = (Button) findViewById(R.id.btnTest);
        mTestButton.setOnClickListener(this);

        mOpenButton = (Button)findViewById(R.id.btnOPen);
        mOpenButton.setOnClickListener(this);

        mCloseButton = (Button)findViewById(R.id.btnClose);
        mCloseButton.setOnClickListener(this);

        //star a thread for psam action
        mWorkThread = new HandlerThread("sdk_fiscal_thread");
        mWorkThread.start();
        mWorkHandler = new WorkHandler(mWorkThread.getLooper());


    }

    public void onClick(View v) {

        mResultTextView.setText("");

        switch (v.getId()){
            case R.id.btnOPen:
                mWorkHandler.sendEmptyMessage(WorkHandler.MSG_FISCAL_OPEN);
                break;
            case R.id.btnTest:
                mWorkHandler.sendEmptyMessage(WorkHandler.MSG_FISCAL_TEST);
                break;
            case R.id.btnClose:
                mWorkHandler.sendEmptyMessage(WorkHandler.MSG_FISCAL_CLOSE);
                break;

        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mWorkHandler.removeCallbacksAndMessages(null);
        mWorkThread.quitSafely();

    }

    private String arrayToString(byte[] arr) {
        StringBuffer sb = new StringBuffer();
        for (int i = 0; i < arr.length; i++) {
            String b = String.format("0x%02x, ", arr[i]);
            sb.append(b);
        }
        return sb.toString();
    }

    private void fiscaltest(){
        int ret;
        String str = "04010030ffcd";

        byte[] cmd = new byte[6];
        cmd[0] = (byte)0x04;
        cmd[1] = (byte)0x01;
        cmd[2] = (byte)0x00;
        cmd[3] = (byte)0x30;
        cmd[4] = (byte)0xff;
        cmd[5] = (byte)0xcd;

        ret = posApiHelper.fiscalWrite(cmd);
        if(ret == 0){
            byte[] buffer = new byte[36];
            ret = posApiHelper.fiscalRead(buffer,36,500);

            if(ret > 0){
                mResponse = arrayToString(buffer);

                runOnUiThread(new Runnable() {
                    public void run() {
                        mResultTextView.setText(mResponse);
                    }
                });

            }else{
                error_code = ret;
                runOnUiThread(new Runnable() {
                    public void run() {
                        mResultTextView.setText("Read fail: [ " + error_code + "]");
                    }
                });
            }

        }else{
            error_code = ret;
            runOnUiThread(new Runnable() {
                public void run() {
                    mResultTextView.setText("Write fail, [ " + error_code + "]");
                }
            });
        }


    }
}
