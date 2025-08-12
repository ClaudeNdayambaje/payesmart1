package test.apidemo.activity;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.Nullable;

import java.io.UnsupportedEncodingException;

/*
*All  action：
*
* 1.ACTION_BAR_SCANCFG   Set the scanner  parameter

   {example:
   Intent intent= new Intent("ACTION_BAR_SCANCFG");
   intent.putExtra("EXTRA_TRIG_MODE", 0);//set Normal mode
   intent.putExtra("EXTRA_SCAN_MODE", 3);//set api result mode
   intent.putExtra("EXTRA_SCAN_AUTOENT", 1); //result will auto word wrapping
   ScanActivity.this.sendBroadcast(intent);
   }

       EXTRA_SCAN_POWER  ------ set Scanner  power init
             1  open   scanner
             0  close  scanner

       EXTRA_TRIG_MODE  ---------  set Scanner mode
              0     Normal mode once mode
              1     Continiues mode scanner will one by one

       EXTRA_SCAN_AUTOENT
              0
              1     Scanner result will support word wrapping

       EXTRA_SCAN_MODE  -------- set Scanner Result mode
             1   set this Mode  scanner result will auto fill into Edittext
             2   set this Mode  scanner result will input like keyevent input

             3   set this Mode  scanner result will API return from broadcast
                      Used it like this:
                                 IntentFilter filter = new IntentFilter("ACTION_BAR_SCAN");
                                 ScanActivity.this.registerReceiver(mScanRecevier, filter);
                                 mScanRecevier = new BroadcastReceiver() {
                                        intent.getIntExtra("EXTRA_SCAN_LENGTH", 0);---------get Result Length
                                        intent.getIntExtra("EXTRA_SCAN_ENCODE_MODE", 1);-----get encodetype
                                        String scanResult = intent.getStringExtra("EXTRA_SCAN_DATA"); --get result
                                  }

* 2.ACTION_BAR_TRIGSCAN -----Start the Scanner  [Because the scanner will automatically time out and stop, it is generally not necessary to actively call stop]
   In Continiues mode  ACTION_BAR_TRIGSCAN can stop scanner directly
   {example:
   Intent intent= new Intent("ACTION_BAR_TRIGSCAN");
   ScanActivity.this.sendBroadcast(intent);
   }
*
*
*/

public class ScanActivity extends Activity implements View.OnClickListener {

    private Button btnDisableScan, btnEnableScan, btnNormal, btnContinuous, btnStartScan, btnStopScan;
    private TextView tvMsg;
    private BroadcastReceiver mScanRecevier = null;

    public static final int ENCODE_MODE_UTF8 = 1;
    public static final int ENCODE_MODE_GBK = 2;
    public static final int ENCODE_MODE_NONE = 3;

    StringBuilder strbuild=new StringBuilder();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //No titleBar
        requestWindowFeature(Window.FEATURE_NO_TITLE);
       /* //FullScreen
       getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);*/
        setContentView(R.layout.activity_scan);

        btnDisableScan = (Button) findViewById(R.id.btnDisableScan);
        btnEnableScan = (Button) findViewById(R.id.btnEnableScan);
        btnNormal = (Button) findViewById(R.id.btnNormal);
        btnContinuous = (Button) findViewById(R.id.btnContinuous);
        btnStartScan = (Button) findViewById(R.id.btnStartScan);
        //btnStopScan = (Button) findViewById(R.id.btnStopScan);

        tvMsg = (TextView) findViewById(R.id.tvMsg);
        tvMsg.setMovementMethod(ScrollingMovementMethod.getInstance());


        btnStartScan.setOnClickListener(ScanActivity.this);
        //btnStopScan.setOnClickListener(ScanActivity.this);

        btnNormal.setOnClickListener(ScanActivity.this);
        btnContinuous.setOnClickListener(ScanActivity.this);

        btnDisableScan.setOnClickListener(ScanActivity.this);
        btnEnableScan.setOnClickListener(ScanActivity.this);

        mScanRecevier = new BroadcastReceiver() {
            public void onReceive(Context context, Intent intent) {
                Log.e("Scan", "scan receive.......");
                String scanResult = "";
                int length = intent.getIntExtra("EXTRA_SCAN_LENGTH", 0);
                int encodeType = intent.getIntExtra("EXTRA_SCAN_ENCODE_MODE", 1);

                if (encodeType == ENCODE_MODE_NONE) {
                    byte[] data = intent.getByteArrayExtra("EXTRA_SCAN_DATA");
                    try {
                        scanResult = new String(data, 0, length, "iso-8859-1");//Encode charSet
                    } catch (UnsupportedEncodingException e) {
                        e.printStackTrace();
                    }
                } else {
                    scanResult = intent.getStringExtra("EXTRA_SCAN_DATA");
                }
                if(strbuild.length()>120) {
                    strbuild.setLength(0);
                }
                strbuild.append(scanResult);
                strbuild.append("\n");
                tvMsg.setText(strbuild.toString());
            }
        };
        IntentFilter filter = new IntentFilter("ACTION_BAR_SCAN");
        ScanActivity.this.registerReceiver(mScanRecevier, filter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        Intent intentEnableScan = new Intent("ACTION_BAR_SCANCFG");
        intentEnableScan.putExtra("EXTRA_SCAN_POWER", 1);
        intentEnableScan.putExtra("EXTRA_SCAN_AUTOENT", 0);
        intentEnableScan.putExtra("EXTRA_SCAN_MODE", 3);
        ScanActivity.this.sendBroadcast(intentEnableScan);
    }

    @Override
    protected void onPause() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onPause();
    }
    @Override
    protected void onDestroy() {
        super.onDestroy();
        ScanActivity.this.unregisterReceiver(mScanRecevier);
        //Restore scan Settings
        Intent intentRestoreScan = new Intent("ACTION_BAR_SCANCFG");
        intentRestoreScan.putExtra("EXTRA_TRIG_MODE", 0);
        intentRestoreScan.putExtra("EXTRA_SCAN_AUTOENT", 1);
        intentRestoreScan.putExtra("EXTRA_SCAN_MODE", 1);
        ScanActivity.this.sendBroadcast(intentRestoreScan);
    }
    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.btnStartScan:
                Intent startIntent = new Intent("ACTION_BAR_TRIGSCAN");
                //tvMsg.setText("Start Scan...");
                ScanActivity.this.sendBroadcast(startIntent);
                break;

            case R.id.btnNormal:
                Intent intentNormal = new Intent("ACTION_BAR_SCANCFG");
                intentNormal.putExtra("EXTRA_TRIG_MODE", 0);
                // tvMsg.setText("Set Scan: Normal Mode");
                ScanActivity.this.sendBroadcast(intentNormal);
                break;

            case R.id.btnContinuous:
                Intent intentContinuous = new Intent("ACTION_BAR_SCANCFG");
                intentContinuous.putExtra("EXTRA_TRIG_MODE", 1);
                // tvMsg.setText("Set Scan: Continuous Mode");
                ScanActivity.this.sendBroadcast(intentContinuous);
                break;

            case R.id.btnEnableScan:
              //  tvMsg.setText("Open...");
                Intent intentEnableScan = new Intent("ACTION_BAR_SCANCFG");
                intentEnableScan.putExtra("EXTRA_SCAN_POWER", 1);
                ScanActivity.this.sendBroadcast(intentEnableScan);
                break;

            case R.id.btnDisableScan:
               // tvMsg.setText("Close...");
                Intent intentDisScan = new Intent("ACTION_BAR_SCANCFG");
                intentDisScan.putExtra("EXTRA_SCAN_POWER", 0);
                ScanActivity.this.sendBroadcast(intentDisScan);
                break;
            default:
                break;
        }
    }
}