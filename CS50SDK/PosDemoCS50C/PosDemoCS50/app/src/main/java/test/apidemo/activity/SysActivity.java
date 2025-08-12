package test.apidemo.activity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.ctk.sdk.PosApiHelper;

import java.io.File;


/**
 * Created by Administrator on 2021/03/17.
 */

/*
*
* PosApiHelper posApiHelper = PosApiHelper.getInstance();

* Update
      disableFunctionLaunch(true)
       int ret = posApiHelper.SysUpdate();
       if (ret == 0) {
            //update  ok
       }
       disableFunctionLaunch(false);

   Note :if  We do this at the front desk  better be call disableFunctionLaunch(true) first when update，Avoid the impact of the key on the upgrade,update over we need call disableFunctionLaunch(false);
         if do update on background service，no need
* SetSN
        String snString = editSn.getText().toString();
        int ret = posApiHelper.SysWriteSN(snString.getBytes());
        if (ret == 0) {
            //write sn ok
        }
*
* GetSN
         byte SN[] = new byte[32];
         int ret =posApiHelper.SysReadSN(SN);
         if (ret == 0) {
            String strsn= ByteUtil.bytesToString(SN);
         }
*
* GetChipID
         byte chipIdBuf[] = new byte[16];
         int ret = posApiHelper.SysReadChipID(chipIdBuf, 16);
         if (ret == 0) {
            String strchipid= ByteUtil.bytearrayToHexString(chipIdBuf, 16);
          }
*
* Get Version
        int ret = posApiHelper.SysGetVersion(version);
        if (ret == 0) {
              String  strSECAV    =  "Security App Version: V" + version[0] + "." + version[1] + "." + version[2]
              String  strSOLIBV   =  "SO Lib Version: V" + version[3] + "." + version[4] + "." + version[5]
              String  strSECBOOTV =  "Security Boot Version: V" + version[6] + "." + version[7] + "." + version[8];
            }
        }
*
* */

public class SysActivity extends Activity implements OnClickListener {

    public static final int OPCODE_SET_SN = 0;
    public static final int OPCODE_GET_SN = 1;
    public static final int OPCODE_GET_CHIP_ID =2;
    public static final int OPCODE_GET_BEEP =3;
    public static String[] MY_PERMISSIONS_STORAGE = {
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.MOUNT_UNMOUNT_FILESYSTEMS"};

    public static final int REQUEST_EXTERNAL_STORAGE = 1;

    private final String TAG = "SysActivity";

    byte SN[] = new byte[32];
    String snString = "";
    byte version[] = new byte[9];

    EditText editSn = null;
    TextView tvMsg = null;

    Button btnUpdate,btnSetSN, btnGetSN, btnGetChipID, btnVersion , btnBeep;
    int ret = 0;

    PosApiHelper posApiHelper = PosApiHelper.getInstance();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_sys);

        this.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        tvMsg = (TextView) findViewById(R.id.textview);
//       tvMsg.setMovementMethod(new ScrollingMovementMethod());

        editSn = (EditText) findViewById(R.id.editSn);

        btnUpdate = (Button) findViewById(R.id.btnUpdate);
        btnSetSN = (Button) findViewById(R.id.btnSetSN);
        btnGetSN = (Button) findViewById(R.id.btnGetSN);
        btnGetChipID = (Button) findViewById(R.id.btnGetChipID);
        btnVersion = (Button) findViewById(R.id.btnVersion);
        btnBeep = (Button) findViewById(R.id.btnBeep);

        btnUpdate.setOnClickListener(this);
        btnSetSN.setOnClickListener(this);
        btnGetSN.setOnClickListener(this);
        btnGetChipID.setOnClickListener(this);
        btnVersion.setOnClickListener(this);
        btnBeep.setOnClickListener(this);
    }

    protected void onResume() {
        // TODO Auto-generated method stub
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onResume();
    }

    @Override
    protected void onPause() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        synchronized (this) {
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    void startTestSys(int OpCode) {
        switch (OpCode) {
            case OPCODE_GET_SN:
                tvMsg.setText("Get SN...");

                ret = posApiHelper.SysReadSN(SN);
                if (ret == 0) {
                    //tvMsg.setText("Read SN Success: " + new String(SN,ByteUtil.returnActualLength(SN)).trim());
                    tvMsg.setText("Read SN Success: " + ByteUtil.bytesToString(SN));
                } else {
                    tvMsg.setText("Read SN Failed");
                }
                break;
            case OPCODE_SET_SN:
                tvMsg.setText("Set SN...");
                snString = editSn.getText().toString();
                ret = posApiHelper.SysWriteSN(snString.getBytes());
                if (ret == 0) {
                    tvMsg.setText("Write SN Success\n" + "setSN : " + snString);
                } else {
                    tvMsg.setText("Write SN Failed");
                }
                break;
            case OPCODE_GET_CHIP_ID:
                byte chipIdBuf[] = new byte[16];
                ret = posApiHelper.SysReadChipID(chipIdBuf, 16);
                if (ret == 0) {
                    tvMsg.setText("Read ChipID Success: " + ByteUtil.bytearrayToHexString(chipIdBuf, 16));
                } else {
                    tvMsg.setText("Read ChipID Failed");
                }
                break;
            case OPCODE_GET_BEEP:
                ret = posApiHelper.SysBeep();
                if (ret == 0) {
                    tvMsg.setText("Beep Success: ");
                } else {
                    tvMsg.setText("Beep Failed");
                }
                break;

            default:
                break;
        }
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    void getSysVersionInfo() {
        ret = posApiHelper.SysGetVersion(version);
        Log.e(TAG, "getSysVersionInfo ret = " + ret);
        if (ret == 0) {
            if (version[6] == -1 && version[7] == -1 && version[8] == -1) {
                tvMsg.setText(" SP Version: CS50-" + version[0] + "." + version[1] + "." + version[2] +
                        "\nSO Lib Version: V" + version[3] + "." + version[4] + "." + version[5] +
                        "\nSecurity Boot Version: NULL" + "\nSucceed"
                );
            }
            else {
                tvMsg.setText("Security App Version: V" + version[0] + "." + version[1] + "." + version[2] +
                        "\nSO Lib Version: V" + version[3] + "." + version[4] + "." + version[5] +
                        "\nSecurity Boot Version: V" + version[6] + "." + version[7] + "." + version[8]
                        + "\nSucceed");
            }
        }else {
            tvMsg.setText("Get_Version Failed");
        }
    }

    private void restartApp() {
        android.os.Process.killProcess(android.os.Process.myPid());
    }

    ProgressDialog updateDlg = null;

    private void startUpdate() {
        Log.e(TAG, "startUpdate  ........ 00");
        //Sys.Lib_LogSwitch(1);
        updateDlg = ProgressDialog.show(this, null, getString(R.string.isUpdating), false, false);
        new Thread() {
            @Override
            public void run() {
                super.run();

//                synchronized (this) {
                    int ret = posApiHelper.SysUpdate();
//                }

                Log.e(TAG, "SysUpdate ret = " + ret);
                if (ret == 0) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            updateDlg.cancel();
                            //升级成功 重启应用
                            tvMsg.setText(R.string.update_finish);
                        }
                    });

                    new Thread() {
                        public void run() {
                            try {
                                sleep(2000);
                                restartApp();
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                        }
                    }.start();

                } else {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            updateDlg.cancel();
                            tvMsg.setText(R.string.update_fail);
                        }
                    });
                }
            }
        }.start();
    }

    /**
     * @Description: Request permission
     * 申请权限
     */
    private void requestPermission() {
        //检测是否有写的权限
        //Check if there is write permission
        int checkCallPhonePermission = ContextCompat.checkSelfPermission(SysActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE);

        if (checkCallPhonePermission != PackageManager.PERMISSION_GRANTED) {
            // 没有写文件的权限，去申请读写文件的权限，系统会弹出权限许可对话框
            //Without the permission to Write, to apply for the permission to Read and Write, the system will pop up the permission dialog
            ActivityCompat.requestPermissions(SysActivity.this, MY_PERMISSIONS_STORAGE, REQUEST_EXTERNAL_STORAGE);
        } else {
            updateMcu();
        }
    }

    /**
     * a callback for request permission
     * 注册权限申请回调
     *
     * @param requestCode  申请码
     * @param permissions  申请的权限
     * @param grantResults 结果
     */
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_EXTERNAL_STORAGE) {
            if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                updateMcu();
            }
        }
    }

    private void updateMcu() {

        tvMsg.setText("Update...");

        File file = null , file1 = null;
//        file = new File("/storage/emulated/0/Download/CS50_APP.bin");
//        file = new File("/storage/emulated/0/Download/A59_APP.bin");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            file = new File("/storage/emulated/0/Download/CS50_APP.bin");
        } else {
            file = new File("/storage/emulated/0/Download/CS50_APP.bin");
        }

        if (!file.exists()) {
            Toast.makeText(getApplicationContext(), getString(R.string.file_not_found), Toast.LENGTH_SHORT).show();
            return;
        }

        new AlertDialog.Builder(this).setTitle(R.string.update)
                .setMessage(R.string.update_or_not)
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        startUpdate();
                        dialog.cancel();
                    }
                }).setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                // TODO Auto-generated method stub
                dialog.cancel();
            }
        }).show();
    }

    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.btnUpdate:
                //Determine if the current Android version is >=23
                // 判断Android版本是否大于23
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    requestPermission();
                } else {
                    updateMcu();
                }
                break;

            case R.id.btnSetSN:
                startTestSys(OPCODE_SET_SN);
                break;

            case R.id.btnGetSN:
                startTestSys(OPCODE_GET_SN);
                break;

            case R.id.btnGetChipID:
                startTestSys(OPCODE_GET_CHIP_ID);
                break;

            case R.id.btnVersion:
                getSysVersionInfo();
                break;

            case R.id.btnBeep:
                startTestSys(OPCODE_GET_BEEP);
                break;
        }
    }
}
