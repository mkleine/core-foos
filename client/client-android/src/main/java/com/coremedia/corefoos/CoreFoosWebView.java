package com.coremedia.corefoos;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;

public class CoreFoosWebView extends Activity {

  private WebView mWebView;

  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.main);

    mWebView = (WebView) findViewById(R.id.webview);
    mWebView.getSettings().setJavaScriptEnabled(true);
    mWebView.loadUrl("file:///android_asset/index.html");
    //mWebView.clearCache(true);
    //mWebView.loadUrl("http://10.0.2.2:8080/index.html");  // 10.0.2.2 is localhost of host machine
  }

}
