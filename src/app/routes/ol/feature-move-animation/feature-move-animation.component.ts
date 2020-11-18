import { AfterViewInit, Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import polyline from '@mapbox/polyline';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import Polyline from 'ol/format/Polyline';
import Geometry from 'ol/geom/Geometry';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

@Component({
  selector: 'app-feature-move-animation',
  templateUrl: './feature-move-animation.component.html',
  styles: [
    `
      .map {
        width: 100%;
        height: 600px;
      }
    `,
  ],
})
export class FeatureMoveAnimationComponent implements OnInit, AfterViewInit {
  animating = false;
  speed;
  now;
  speedInput;
  startButton;
  map;
  geoMarker;
  vectorLayer;
  center;
  routeCoords;
  routeLength;
  styles;

  polyLine: any;
  constructor(private http: _HttpClient) {}

  ngAfterViewInit(): void {
    this.http
      .post('https://garbagesortingcity.fine1.com.cn/8888/influxdb/health/selectByTable', {
        comCode: 'cus000001cus000007',
        tbName: 'carGps',
        timePoliy: '天',
        carNum: '粤BDL1013',
      })
      .subscribe((d: any[]) => {
        const l = d.map((j) => fromEPSG4326([j.longitude, j.latitude]));
        // this.polyLine = new Feature({
        //   opt_geometryOrProperties: new LineString(l, GeometryLayout.XYZ),
        // });
        this.polyLine = new LineString(l, GeometryLayout.XYZ);
        this.initMap();
      });
  }

  ngOnInit(): void {}

  initMap() {
    const resolutions = []; // 分辨率数组
    const tileSize = 256;
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    this.center = [12699989.526708398, 2577327.1035168194];
    console.log(toEPSG4326(this.center));

    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }

    const tileGrid = new TileGrid({
      // 投影坐标系范围的左下角作为瓦片坐标系原点
      origin: getBottomLeft(prjExtend),
      resolutions,
      extent: prjExtend,
      tileSize: [256, 256],
    });

    // const polyline = 'goohCaajvTYa@[sAKuAWaBC_AVmA`@mAOyAUiCe@uC_@eC}@{BeB_CcCgA_By@sBkA_C}AwBgB{BoAwBeAsBsAiBaByCbBU`A_@NkE@iCB}BBeB@gAAW@_AWw@YE}CMkCSgCFuDQmEQyFIyGMyGK}GM{GYwKJiA?cBEaDMwDC{E`@mELYRMbD_@tBiA`A?hD|AfErBnDhBX\@PGVQt@ZYL_@\_A?YKMiC{AoE}BeFaCaFaByFOmGBiGa@wGmAyGQqHvB_HlCsHz@{Hh@iIV}GHyG?gFEeDIuDAkD@wCDcDF}Fj@wG|BwF`C{ElBeChAgBt@iBn@yCb@qETqDHqDDg@?{AJeF@mF?qDEsAGWQIWAYh@gB\}@?s@iBsAwBwByAyA_@i@yBcBuCkCwCwCoB}BGe@U}D[mCc@mCe@oCk@mD[kAO]]mBi@{Cg@kEAqFR{FJ_FPkF?{GsAsFaCuEyA}Cy@mC?_@pAg@~@SbCq@zAK|@HlAd@|@tA\bBIvDFvEQ|DI~CPf@x@l@fAb@TCNGp@oA??Yp@??u@l@MCg@UL{@????e@Fh@[J`@_@?m@HLkBY_ACmBLcC?sCGsCFgCo@uBs@q@o@U}@KuBRaAPi@Kq@Jq@d@mAVMCIMSqD@_GGqD?eD@gF@yGW{Gs@yFeAqEO{@FSTInDGjFGxE?nDO`FU``B{VxDvArCdDnB`DvBlDhDjDtDfAdHRtGTxBh@hAfAv@xBz@tGr@tFVnC\`CXtB\`Cj@tCb@vG_@lGuA`HkAfGg@bEIzDOxEJ`Gl@hG~AhEv@`E^`EXtELdFDrFFtGJlHF`IHnHPvH`@nGh@pEj@nEh@bF`@jEVrEEhEUfFGxFWrFMvFArFHfGFlFDrGHvFBdEDvFMfGQpB_@`@]Fq@G]UQ_@Ek@Fa@\m@ZQbA?vEDhFG~FKhGKpFFzFbAdGzBrFpBhGp@dF[tEAjE?vFIlFGhGEnHH~GtArG|CjGxCdGfCpFXfG?nG]rEYvFf@~ElA|DnA~ErArMzErBXd@A~CCnDBjCZjD~@dEfAvEzApBv@bCx@vEjAzCh@tDtAlA\XHtAb@zCr@bEhApE~AzCrAtAl@f@Jd@LvCv@nDj@tDdAlCx@NFAp@k@z@c@C`AQj@eBOMcCw@}Cy@_Dk@mBe@mCcA_Dw@kDuAeEoAuCw@yAi@YGcB_@{CaAsEsAwDqAiCi@sCq@iDsAwDqA_FoA}Eq@eE_@_CEwC[yD}@qF}AsGiByFaBmFmAwF]iGZsHR_HEqFoA_GqCeFaCqFuBuGiAaFA{B@aCDeE@uE?wC?oCB_D?gEDaGQqFaAuEcB_EuAgF_A{FIoH?wHJuG?gG_@aF]aF_@aDG_D?uEDuC@_EHgD?}BBoDBoD?qE?}EIeFIsE@u@?QSMq@@}EJ}FBqF?cF?aFAyBB}@AqCAaF?sECgDBoE?cE?gC?}A?mEBeGD{GCwFCyD@w@ACIsAQKY?sDXuDTuBHk@AoADuBHwBFiB@uC@gCBqBC}CAc@IQOMYfA}ECUOSaCiBsByBaC_CaDwCeDuCkB_CcAaB_@{E}@eGqA}H?OEOa@sBo@{Ck@eDSmCDaGToHT_I@gHgB{GiCeF[o@eAwCSwAJQnDs@bCm@rABbANt@f@hAhDElEBjEOdEAtCLZ`Av@~@^VEh@u@IeAlApBCc@aAT_@V_@@SEyAy@]g@Io@HmDJgEIiEFuCUwAq@iA}Fq@y@Fw@Cm@p@w@Ps@JSMMu@IiEDaG@sHAeIIcIq@kHeA_F]oBVGjCI|BMlCAd@@tAAl@?rBEjBa@ndBqWzEdAnCtB~AbClAtBjB~CzCdD~DxAhHXvGR~Bh@jAbAt@~B|@zGx@lGr@pEPjANbAPfAJr@Jt@\xC\~Fm@~GsAfG}@|Em@pEGtDOxEHnGr@xGtAzF~@rGBzGH~FRfFXzEDxFHhFFvC@lBDpC?vCUzASRWD[IUUI_@?wCRm@XS~@OjGAlGYhGc@lGgAvFiC`GaBdGHtD~@pDr@|BTJHV~@VtA^t@~@ZxARZZNrC?t@@p@LRAt@_@`BHZPf@@fBD~@?pC?zEPlFNhFVpGJvGLjHNzHv@zl@SzFSxGObIA`GChGGbGMlFApCI|BInCEtCAtDCvFOpFKdACh@LPTDdDPfEn@fD^nB^d@Lz@J~BdAsCh@Tc@hAnAApBi@HiA?dCYJgBPcBCq@IOsBAiCYgCWiC[mCQcBSy@Wk@CMNy@`DkApEkB~EsClDmDlCwD~AeEfBwE~AqAL}Dy@yDuA}@m@cRsa@kAiFO_GDcFIiEG}EJoGPmHNuHRoNFaDCqCCqCAeBCgBCmBCaBAeAAwAEgBAgBEqCEiCAyCCkBBgDFwDBkCJyEZwHeBa]{@oHk@{GQmFCwAA{@@{@?_@Cg@?}@Ai@E}@?u@CeA?{@C{@?aACy@AoAEuAA}@AwAA_AAs@CmAAw@Cm@?w@CoAC{@AcAEcBGiAIaBOqCWyCg@kDc@oDc@}FOcF?cB?mEZeHr@sGhAmGp@iH]yHy@mFw@oGMaG[wD_AmD_@{Ca@sDOaEB]Zc@f@Y`@?`@Nn@lAGx@Ud@_@RiAF}EGoFQiGO_G]qCaA{BcCqCyE{CyEyDcDaEy@}DPcHvAg`BpUyAeAYy@e@sF[_F_@cF_@iE[gCe@aDu@aE}@sDwA_FuAoEeAcD]iAQi@e@wA{@sCoA_E_AiDgAmGYyCOyCEsCAcB?eA@aAFoANiBZkDl@yFj@yG^sFDkDGgAA_CI_BIaAOqAGc@UoASgAa@oBOu@U}@_@{AOs@[qAWiA[qAUcA_@{AYuAYeA_@cBo@iCIYQy@Sy@Om@a@eBi@uBe@qBu@_Du@aDWoAa@sBc@kCa@oCWaC[oEK_CKaDCuDBuCFaDPuDT_Dd@gEl@gEr@qEj@wDp@kEx@iFz@yFbAyG~@aIN{HO{GOaHMyGOsHWsHaTqZiGaB}GgBcFiA}C{@mBe@{Ae@oCiAaDqBiD{CcCqDyBqEoI_TwBgFcCsE{CmD_F_E_F{BaDkAgCs@sC}@uE}AkF}ByE{DcEgG_DcGoEmFmG}DyHmBoGsA_G}AeFyA}C{B_BkDc@uGIiGo@cGq@oF\\uAh@iBCk@S_@i@c@w@Gw@PeEpCkE~C_Br@W?mBSs@BmCCqBQ{@k@_BqCe@_EVqCZm@r@c@nBd@N`@Dx@Kf@y@x@_Cf@eGZ{GAgHe@yH{@sIgBiIeC}HiC_IgC{HwBeIqA_Ji@qJNaKx@aK`A{J~@}Jz@wJXuJa@kJoAgJqCiIcEoHqFgHaGkIyEqJaDeK}AaKmAkKqAiKiAyKO{KrAaKfDaKbEcJpDuJvBkKN}JwAuJuD{I_DaIsAsGo@sCMm@G}@?{AE]B}Ch@cDj@oDx@uCh@gB`@UFGBcAPg@T?d@`AlBj@xA^r@JVh@fA|A`CdCdD~CrDtCbDn@v@d@d@nBdB~AnAz@h@ZVn@l@l@Z@d@y@bC{A`DiB`EoAnCk@rA}@pBoAjCw@zA]`@YCcAw@mBoA_BcAs@yAp@{A^i@@dBo@oBA]l@pAk@XOh@UdBv@^lAh@bAx@dAf@~@d@t@Hr@{AT[SJRYb@gAdA}BjAkCdAaCl@oAhAaCnAoCbAgC`@QhChAhCfAbC|@bAb@HBJHtBt@zB|@~@HKOsC}@}EoBkFsB_FaCiDgCiA{@KK{A}AmCqC_DwDuCoDoBcC_AmAIM]a@mAeC]mAB[L[ZSxCaA~Cs@XEr@O`@IbAUtAO~AMpBEhCSpBE~D?jGh@`H`BdInClIxClJxAlJIrIeBrIeDdHqC`HmC`IaCdJaArJDfJbAlJlAnJlAdJhAhIpBxH~CnHbFfH`GzHbFvInD~JfCbK`AfK@dKs@rJcAvJ}@pIw@bIe@xIClJz@hJbBlJpCxIlCdIhCjIxBpHnAvFl@pFXfFXfD`ArDjDrCfCnBn@zAGrCaA~A]t@L~@j@h@fAx@pFbAtFvAxExB|DrDpDjElBzEbAvE`AdFjAvFnAhGnBvE|ChDjErChFrC~EfDhDhEdCxDtA~DvA~DvAdDjAhAh@dAj@rAx@v@l@dAz@z@|@`AjAjAhBjArBbA`CjAhCpAxCbOfZnC|CzDxCxExBnFtAhG|AzFxA~FvAdHzBnFhD~ItXAdADrBFpDJhEJ`FLzFHpFE~EWhE[zBUlAKt@[`AWfAKr@W~Aa@|B]bCc@lDm@dFs@fFw@hFc@pDUfCWvCQtDIfD?zA?`B@nBHxCNfCH|ANvBXhCZhC^fCf@nCr@~Cv@xCj@xB`@pBj@dCl@bCj@fCr@xCt@tCn@xCfApE~AjG|AtHn@bIEdIm@vIm@pHi@xG_@pILvIl@dHpA~GzAfFxAlEnBrGbBvFdBtFtArF|@lEl@nFJrEHzCLpDVzEr@nE?|Ae@RuCRwBIc@HaCDCHERZpAtB`FzAzFLlGCfEIxBAzDDbEC~CBfBIjCLjCVjCT|AJLXIF?t@_@PWBSM{AFKx@c@|@CnBQx@m@hADj@Ep@N\^bAbBRhAEjBJ~BBdCK`CMhCCvBPd@dAz@~@\PKJKbAgAkAvAq@Ia@MH@AAGGT_A??GP_AH_@i@Ew@H{F??j@cC??btB|kBoHpAcG|B{D`BoA`@eAVmBt@mDvAmASWwBAeD?QSa@}Ah@qAd@}@VkBn@aBf@gBF{@?U?a@SCUEsBCoBAqAAa@Aw@CUKWQGm@X}@~@sC~A_Dd@oDPy@Tk@f@}@nBo@~@UB_@OyC}BgCiCmCgCuCiCwBmBGI_AcAuAuBWuEs@{F{@_FaAcFeAgFk@qDGuFT{GRmHVsIcA}GwBaFcA}Ae@iAUe@q@}BGm@h@WjEcAfB]vBRr@f@nAdDGxDF~EShEBpCTh@`BdAVFTGNKFuBy@GVLFFD`B[TO?yA_Ac@m@Is@@gD\{DI{DH}A?EKoBe@{Ay@{@_Bc@kB@y@VgAO[P]`@e@ToADKi@M_E@qG?iH?oIEgHKcCUkAOoAw@qEOs@e@{ABQHQNEvDSbAEt@D~@GtABf@CfACz@BfACz@OjiBiWzDbBrD|ExBxDjArB\Z`@^|@r@t@h@h@Rh@FbBJp@Fr@F~@Dz@Dt@BnBDd@@fAHj@Br@Jj@RfA|@b@~@^`BZ~Bb@rCd@vD`@~C^nCTxAJh@V|ATzATrAR`ANrAL|AFtCGhCSdBg@bC]hBe@rCa@lDSlCK|BEbB@~A@lABvB?pBLhBJdBXjBNnARzAT`BThBPrBJfCNxCHxCJrDFxEB`FF`FBfEB|A?j@FpADbCD`B@`AB~AFdBDlBLrBF~@JjAJhARfBLpANfAJr@Dz@JhAHv@PxAZdCTxCFjCKhFYdIYpIGbI?fHLzGDvGFlFBzDDjGGnFSxDUTc@H}A}@pAkC~@?zA@hB?`DGfFKrFKlEAjEThEz@nDlAfDhAnAl@z@Zp@LdARtALdB?fCGbB?`E@dAPXTTj@Bt@K^W\{Cc@Ay@FkGTkHRuHFwFAgGCcEX[bAMv@EfACbC?zA?jAExKmEpA^pAfAdA`@n@v@zFvCd@f@h@^f@d@~BlBvC~AtAr@hBlAtA`CrAjCb@bCRz@V`CFrBMnAe@|AFlAHxAL~ALhAp@Xh@Nk@Ko@S[iAG{AGeAQoAJ_ANk@\gAAmAG_BSwAWuAOiA]wAe@wAi@gA_@UuAs@eA}@sBmAeAg@cAo@}AiAuAaA}AuAuAs@aBq@yBaBuByBuEfEiACOOOIUAUH_@NsCDuCDuBB_A@UI_AQi@c@By@?MG_Ai@{FV_AEeESgFMsGe@w\GsAQcEAcAKwB?}DAcEEcGFwE^qBh@g@^@dBK`D}Ax@JjBfAx@Zj@V~@h@xAn@hCtAx@b@AR]r@DbA`@wAJSDIRu@EYQSqD_BwE_C}EiCyEgAqFOeGH_Gi@kE}@gEe@gFZeDfAaEfB_G|AaIl@uIj@uHLeHHsHEeGI';
    const polyline = [
      'hldhx@lnau`BCG_EaC??cFjAwDjF??uBlKMd@}@z@??aC^yk@z_@se@b[wFdE??wFfE}N',
      'fIoGxB_I\\gG}@eHoCyTmPqGaBaHOoD\\??yVrGotA|N??o[N_STiwAtEmHGeHcAkiA}^',
      'aMyBiHOkFNoI`CcVvM??gG^gF_@iJwC??eCcA]OoL}DwFyCaCgCcCwDcGwHsSoX??wI_E',
      'kUFmq@hBiOqBgTwS??iYse@gYq\\cp@ce@{vA}s@csJqaE}{@iRaqE{lBeRoIwd@_T{]_',
      'Ngn@{PmhEwaA{SeF_u@kQuyAw]wQeEgtAsZ}LiCarAkVwI}D??_}RcjEinPspDwSqCgs@',
      'sPua@_OkXaMeT_Nwk@ob@gV}TiYs[uTwXoNmT{Uyb@wNg]{Nqa@oDgNeJu_@_G}YsFw]k',
      'DuZyDmm@i_@uyIJe~@jCg|@nGiv@zUi_BfNqaAvIow@dEed@dCcf@r@qz@Egs@{Acu@mC',
      'um@yIey@gGig@cK_m@aSku@qRil@we@{mAeTej@}Tkz@cLgr@aHko@qOmcEaJw~C{w@ka',
      'i@qBchBq@kmBS{kDnBscBnFu_Dbc@_~QHeU`IuyDrC_}@bByp@fCyoA?qMbD}{AIkeAgB',
      'k_A_A{UsDke@gFej@qH{o@qGgb@qH{`@mMgm@uQus@kL{_@yOmd@ymBgwE}x@ouBwtA__',
      'DuhEgaKuWct@gp@cnBii@mlBa_@}|Asj@qrCg^eaC}L{dAaJ_aAiOyjByH{nAuYu`GsAw',
      'Xyn@ywMyOyqD{_@cfIcDe}@y@aeBJmwA`CkiAbFkhBlTgdDdPyiB`W}xDnSa}DbJyhCrX',
      'itAhT}x@bE}Z_@qW_Kwv@qKaaAiBgXvIm}A~JovAxCqW~WanB`XewBbK{_A`K}fBvAmi@',
      'xBycBeCauBoF}}@qJioAww@gjHaPopA_NurAyJku@uGmi@cDs[eRaiBkQstAsQkcByNma',
      'CsK_uBcJgbEw@gkB_@ypEqDoqSm@eZcDwjBoGw`BoMegBaU_`Ce_@_uBqb@ytBwkFqiT_',
      'fAqfEwe@mfCka@_eC_UmlB}MmaBeWkkDeHwqAoX}~DcBsZmLcxBqOwqE_DkyAuJmrJ\\o',
      '~CfIewG|YibQxBssB?es@qGciA}RorAoVajA_nAodD{[y`AgPqp@mKwr@ms@umEaW{dAm',
      'b@umAw|@ojBwzDaaJsmBwbEgdCsrFqhAihDquAi`Fux@}_Dui@_eB_u@guCuyAuiHukA_',
      'lKszAu|OmaA{wKm}@clHs_A_rEahCssKo\\sgBsSglAqk@yvDcS_wAyTwpBmPc|BwZknF',
      'oFscB_GsaDiZmyMyLgtHgQonHqT{hKaPg}Dqq@m~Hym@c`EuiBudIabB{hF{pWifx@snA',
      'w`GkFyVqf@y~BkoAi}Lel@wtc@}`@oaXi_C}pZsi@eqGsSuqJ|Lqeb@e]kgPcaAu}SkDw',
      'zGhn@gjYh\\qlNZovJieBqja@ed@siO{[ol\\kCmjMe\\isHorCmec@uLebB}EqiBaCg}',
      '@m@qwHrT_vFps@kkI`uAszIrpHuzYxx@e{Crw@kpDhN{wBtQarDy@knFgP_yCu\\wyCwy',
      'A{kHo~@omEoYmoDaEcPiuAosDagD}rO{{AsyEihCayFilLaiUqm@_bAumFo}DgqA_uByi',
      '@swC~AkzDlhA}xEvcBa}Cxk@ql@`rAo|@~bBq{@``Bye@djDww@z_C_cAtn@ye@nfC_eC',
      '|gGahH~s@w}@``Fi~FpnAooC|u@wlEaEedRlYkrPvKerBfYs}Arg@m}AtrCkzElw@gjBb',
      'h@woBhR{gCwGkgCc[wtCuOapAcFoh@uBy[yBgr@c@iq@o@wvEv@sp@`FajBfCaq@fIipA',
      'dy@ewJlUc`ExGuaBdEmbBpBssArAuqBBg}@s@g{AkB{bBif@_bYmC}r@kDgm@sPq_BuJ_',
      's@{X_{AsK_d@eM{d@wVgx@oWcu@??aDmOkNia@wFoSmDyMyCkPiBePwAob@XcQ|@oNdCo',
      'SfFwXhEmOnLi\\lbAulB`X_d@|k@au@bc@oc@bqC}{BhwDgcD`l@ed@??bL{G|a@eTje@',
      'oS~]cLr~Bgh@|b@}Jv}EieAlv@sPluD{z@nzA_]`|KchCtd@sPvb@wSb{@ko@f`RooQ~e',
      '[upZbuIolI|gFafFzu@iq@nMmJ|OeJn^{Qjh@yQhc@uJ~j@iGdd@kAp~BkBxO{@|QsAfY',
      'gEtYiGd]}Jpd@wRhVoNzNeK`j@ce@vgK}cJnSoSzQkVvUm^rSgc@`Uql@xIq\\vIgg@~k',
      'Dyq[nIir@jNoq@xNwc@fYik@tk@su@neB}uBhqEesFjoGeyHtCoD|D}Ed|@ctAbIuOzqB',
      '_}D~NgY`\\um@v[gm@v{Cw`G`w@o{AdjAwzBh{C}`Gpp@ypAxn@}mAfz@{bBbNia@??jI',
      'ab@`CuOlC}YnAcV`@_^m@aeB}@yk@YuTuBg^uCkZiGk\\yGeY}Lu_@oOsZiTe[uWi[sl@',
      'mo@soAauAsrBgzBqgAglAyd@ig@asAcyAklA}qAwHkGi{@s~@goAmsAyDeEirB_{B}IsJ',
      'uEeFymAssAkdAmhAyTcVkFeEoKiH}l@kp@wg@sj@ku@ey@uh@kj@}EsFmG}Jk^_r@_f@m',
      '~@ym@yjA??a@cFd@kBrCgDbAUnAcBhAyAdk@et@??kF}D??OL',
    ].join('');
    // const route: any = new Polyline({
    //   factor: 1e6,
    // }).readGeometry(this.polyLine, {
    //   dataProjection: 'EPSG:4326',
    //   featureProjection: 'EPSG:3857',
    // });
    const route = this.polyLine;
    this.routeCoords = route.getCoordinates();
    this.routeLength = this.routeCoords.length;

    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    this.geoMarker = /** @type Feature<import("../src/ol/geom/Point").default> */ new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[0]),
    });
    const startMarker = new Feature({
      type: 'icon',
      geometry: new Point(this.routeCoords[0]),
    });
    console.log('eee' + toEPSG4326(this.routeCoords[0]));
    const endMarker = new Feature({
      type: 'icon',
      geometry: new Point(this.routeCoords[this.routeLength - 1]),
    });
    const endPointMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[this.routeLength - 1]),
    });

    this.styles = {
      route: new Style({
        stroke: new Stroke({
          width: 6,
          color: 'red',
        }),
      }),
      icon: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: './assets/images/mark.svg',
          imgSize: [50, 50],
        }),
      }),
      geoMarker: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'black' }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    };

    this.animating = false;

    this.speedInput = document.getElementById('speed');
    this.startButton = document.getElementById('start-animation');

    this.vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, this.geoMarker, startMarker, endMarker, endPointMarker],
      }),
      style: (feature) => {
        // hide geoMarker if animation is active
        if (this.animating && feature.get('type') === 'geoMarker') {
          return null;
        }
        const tStyles = [this.styles[feature.get('type')]];
        const geometry: any = feature.getGeometry();
        // if (geometry && geometry.forEachSegment) {
        //   geometry.forEachSegment((start, end) => {
        //     const dx = end[0] - start[0];
        //     const dy = end[1] - start[1];
        //     const rotation = Math.atan2(dy, dx);

        //     // arrows
        //     tStyles.push(
        //       new Style({
        //         geometry: new Point(end),
        //         image: new Icon({
        //           src: './assets/images/arrow.png',
        //           anchor: [0.75, 0.5],
        //           rotateWithView: true,
        //           rotation: -rotation,
        //           imgSize: [6, 9.5],
        //         }),
        //       }),
        //     );
        //   });
        // }

        return tStyles;
      },
    });

    const view = new View({
      center: this.center,
      zoom: 0,
      extent,
      projection: prj,
      resolutions,
    });

    this.map = new Map({
      layers: [
        // new TileLayer({
        //   source: new TileDebug({
        //     projection: prj,
        //     tileGrid,
        //     // url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        //   }),
        // }),
        new TileLayer({
          source: new XYZ({
            projection: prj,
            // tileGrid,
            url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
          }),
        }),
        this.vectorLayer,
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: defaultControls().extend([new ZoomSlider()]),
    });
  }

  moveFeature(event) {
    const vectorContext = getVectorContext(event);
    const frameState = event.frameState;

    if (this.animating) {
      const elapsedTime = frameState.time - this.now;
      // here the trick to increase speed is to jump some indexes
      // on lineString coordinates
      const index = Math.round((this.speed * elapsedTime) / 1000);

      if (index >= this.routeLength) {
        this.stopAnimation(true);
        return;
      }

      const currentPoint = new Point(this.routeCoords[index]);
      const feature = new Feature(currentPoint);
      vectorContext.drawFeature(feature, this.styles.geoMarker);
    }
    // tell OpenLayers to continue the postrender animation
    this.map.render();
  }

  startAnimation() {
    if (this.animating) {
      this.stopAnimation(false);
    } else {
      this.animating = true;
      this.now = new Date().getTime();
      this.speed = this.speedInput.value;
      this.startButton.textContent = 'Cancel Animation';
      // hide geoMarker
      this.geoMarker.setStyle(null);
      // just in case you pan somewhere else
      this.map.getView().setCenter(this.center);
      this.vectorLayer.on('postrender', this.moveFeature);
      this.map.render();
    }
  }

  /**
   * @param {boolean} ended end of animation.
   */
  stopAnimation(ended) {
    this.animating = false;
    this.startButton.textContent = 'Start Animation';

    // if animation cancelled set the marker at the beginning
    const coord = ended ? this.routeCoords[this.routeLength - 1] : this.routeCoords[0];
    const geometry = this.geoMarker.getGeometry();
    geometry.setCoordinates(coord);
    // remove listener
    this.vectorLayer.un('postrender', this.moveFeature);
  }
}
