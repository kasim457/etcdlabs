import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { BackendService, ServerStatus, ClientRequest, ClientResponse } from './backend.service';

export class LogLine {
  index: number;
  logLevel: string;
  prefix: string;
  text: string;
  constructor(index: number, logLevel: string, text: string) {
    this.index = index;
    this.logLevel = logLevel;

    let date = new Date();
    let yr = date.getFullYear();
    let mo = date.getMonth() + 1;
    let da = date.getDate();
    let timestamp = date.toTimeString().substring(0, 8);
    let moTxt = String(mo);
    if (moTxt.length === 1) {
      moTxt = '0' + moTxt;
    }
    let daTxt = String(da);
    if (daTxt.length === 1) {
      daTxt = '0' + daTxt;
    }
    let timePrefix = String(yr) + '-' + moTxt + '-' + daTxt + ' ' + timestamp;

    if (logLevel.length === 0) {
      logLevel = 'WARN';
    }
    this.prefix = '[' + timePrefix + ' ' + logLevel + ']';

    this.text = text;
  }
}

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
  providers: [BackendService],
})
export class PlayComponent implements OnInit, AfterViewChecked {
  // $("#logContainer").scrollTop($("#logContainer")[0].scrollHeight);
  @ViewChild('logContainer') private myScrollContainer: ElementRef;

  mode = 'Observable';

  logOutputLines: LogLine[];

  selectedTab: number;
  selectedNodes = [true, false, false, false, false];

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;

  inputKey: string;
  inputValue: string;
  deleteReadByPrefix: boolean;

  stressResponse: ClientResponse;
  stressError: string;



  writeResponse: ClientResponse;
  writeError: string;

  deleteResponse: ClientResponse;
  deleteErrpr: string;

  readResponse: ClientResponse;
  readError: string;

  writeResponseTxt: string;
  deleteResponseTxt: string;
  readResponseTxt: string;

  constructor(private backendService: BackendService) {
    this.logOutputLines = [];

    this.selectedTab = 3;

    this.serverStatus = backendService.serverStatus;
    this.serverStatusErrorMessage = '';

    this.inputKey = '';
    this.inputValue = '';
    this.deleteReadByPrefix = false;
  }

  ngOnInit(): void {
    this.sendLogLine('OK', 'Hell World! Connected to etcd cluster!');
    this.getServerStatus();
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  selectTab(num: number) {
    this.selectedTab = num;
  }

  getSelectedNodeIndexes() {
    let idxs = [];
    for (let _i = 0; _i < this.selectedNodes.length; _i++) {
      if (this.selectedNodes[_i]) {
        idxs.push(_i);
      }
    }
    return idxs;
  }

  getSelectedNodeEndpoints() {
    let idxs = this.getSelectedNodeIndexes();
    let eps = [];
    for (let _i = 0; _i < idxs.length; _i++) {
      eps.push(this.serverStatus.NodeStatuses[idxs[_i]].Endpoint);
    }
    return eps;
  }

  getSelectedNodeEndpointsTxt() {
    let eps = this.getSelectedNodeEndpoints();
    let txt = 'No endpoint is selected...';
    if (eps.length > 0) {
      txt = 'Selected endpoints: ';
      for (let _i = 0; _i < eps.length; _i++) {
        if (_i > 0) {
          txt += ',';
        }
        txt += eps[_i];
      }
    }
    return txt;
  }

  sendLogLine(logLevel: string, txt: string) {
    this.logOutputLines.push(new LogLine(this.logOutputLines.length, logLevel, txt));
  }

  // https://angular.io/docs/ts/latest/guide/template-syntax.html
  trackByLineIndex(index: number, line: LogLine) {
    return line.index;
  }

  // TODO: periodic calls on Observable that is returned by fetchServerStatus
  getServerStatus() {
    this.backendService.fetchServerStatus().subscribe(
      serverStatus => this.serverStatus = serverStatus,
      error => this.serverStatusErrorMessage = <any>error);
    this.sendLogLine('OK', 'getServerStatus started!');
  }

  processClientRequest(act: string) {
    let eps = this.getSelectedNodeEndpoints();
    let prefix = this.deleteReadByPrefix;
    let key = this.inputKey;
    let val = this.inputValue;

    let nodeIndex = this.selectedTab - 3;
    if (act === 'stop-node' || act === 'restart-node') {
      eps = [this.serverStatus.NodeStatuses[nodeIndex].Endpoint];
      prefix = false;
      key = '';
      val = '';
    }

    let clientRequest = new ClientRequest(act, prefix, eps, key, val);
    this.backendService.sendClientRequest(clientRequest).subscribe(
      clientResponse => this.writeResponse = clientResponse,
      error => this.writeError = <any>error);
  }
}
